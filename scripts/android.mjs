// Finds the Android SDK and a compatible JDK, and makes sure an emulator is running.
import { spawn, spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { delimiter, join } from "node:path";
import { capture, fail, log } from "./lib.mjs";

const isWindows = process.platform === "win32";
const exe = (name) => (isWindows ? `${name}.exe` : name);
const DEFAULT_AVD = "SmartBot_Pixel";

function findSdk() {
  const candidates = [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    join(homedir(), "Android/Sdk"), // Linux (Android Studio default)
    join(homedir(), "Library/Android/sdk"), // macOS
    process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, "Android/Sdk"), // Windows
  ];
  const sdk = candidates.find((dir) => dir && existsSync(join(dir, "platform-tools")));
  if (!sdk)
    fail("Android SDK not found. Install Android Studio (or the command-line tools) and set ANDROID_HOME.");
  return sdk;
}

function javaMajor(javaHome) {
  const java = javaHome ? join(javaHome, "bin", exe("java")) : "java";
  // Prints JVM properties to stderr.
  const res = spawnSync(java, ["-XshowSettings:properties", "-version"], { encoding: "utf8" });
  return Number(/java\.specification\.version = (\d+)/.exec(res.stderr ?? "")?.[1] ?? 0);
}

/** Android Gradle Plugin needs JDK 17–21; newer JDKs break the build. */
function findJdk() {
  const ok = (v) => v >= 17 && v <= 21;
  if (ok(javaMajor(process.env.JAVA_HOME))) return process.env.JAVA_HOME;

  const dirs = [
    "/usr/lib/jvm/java-21-openjdk",
    "/usr/lib/jvm/java-17-openjdk",
    "/usr/lib/jvm/java-21-openjdk-amd64",
    "/usr/lib/jvm/java-17-openjdk-amd64",
    "/opt/android-studio/jbr",
    join(homedir(), "android-studio/jbr"),
    "/Applications/Android Studio.app/Contents/jbr/Contents/Home",
    "C:\\Program Files\\Android\\Android Studio\\jbr",
  ];
  if (existsSync("/Library/Java/JavaVirtualMachines")) {
    for (const d of readdirSync("/Library/Java/JavaVirtualMachines")) {
      dirs.push(join("/Library/Java/JavaVirtualMachines", d, "Contents/Home"));
    }
  }
  const jdk = dirs.find((d) => existsSync(join(d, "bin", exe("java"))) && ok(javaMajor(d)));
  if (!jdk) fail("No JDK 17–21 found (Android builds need one). Install JDK 21 or set JAVA_HOME.");
  return jdk;
}

function connectedDevices(adb) {
  return capture(adb, ["devices"])
    .split("\n")
    .slice(1)
    .filter((line) => line.endsWith("\tdevice"));
}

/** Newest installed system image matching this machine's CPU, as an sdkmanager package id. */
function pickSystemImage(sdk) {
  const abi = process.arch === "arm64" ? "arm64-v8a" : "x86_64";
  const root = join(sdk, "system-images");
  const images = [];
  for (const api of existsSync(root) ? readdirSync(root) : []) {
    for (const tag of readdirSync(join(root, api))) {
      if (existsSync(join(root, api, tag, abi)))
        images.push({ api, tag, level: Number(api.replace(/\D/g, "")) });
    }
  }
  const tagRank = (t) => ["google_apis_playstore", "google_apis", "default"].indexOf(t) >>> 0;
  images.sort((a, b) => b.level - a.level || tagRank(a.tag) - tagRank(b.tag));
  const best = images[0];
  if (!best) {
    fail(
      `No ${abi} Android system image installed. Install one, e.g.:\n  sdkmanager "system-images;android-36;google_apis;${abi}"`,
    );
  }
  return `system-images;${best.api};${best.tag};${abi}`;
}

function createAvd(sdk, name, env) {
  const image = pickSystemImage(sdk);
  log(`Creating emulator "${name}" from ${image}…`);
  const avdmanager = join(sdk, "cmdline-tools/latest/bin", isWindows ? "avdmanager.bat" : "avdmanager");
  if (!existsSync(avdmanager)) fail("avdmanager not found. Install Android SDK Command-line Tools (latest).");
  // "no" answers the custom hardware profile prompt.
  const out = capture(avdmanager, ["create", "avd", "-n", name, "-k", image, "-d", "pixel_7"], {
    input: "no\n",
    env,
  });
  if (!out)
    fail(`Failed to create AVD ${name}. Create one in Android Studio and set ANDROID_AVD to its name.`);
}

async function waitForBoot(adb, timeoutMs = 240_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (capture(adb, ["shell", "getprop", "sys.boot_completed"]) === "1") return;
    await new Promise((r) => setTimeout(r, 2000));
  }
  fail("Emulator did not finish booting in time.");
}

/** Returns the env (ANDROID_HOME, JAVA_HOME, PATH) Expo/Gradle need, with a device ready. */
export async function prepareAndroid() {
  const sdk = findSdk();
  const jdk = findJdk();
  const env = {
    ...process.env,
    ANDROID_HOME: sdk,
    JAVA_HOME: jdk,
    PATH: [join(sdk, "platform-tools"), join(sdk, "emulator"), join(jdk, "bin"), process.env.PATH].join(
      delimiter,
    ),
  };
  const adb = join(sdk, "platform-tools", exe("adb"));
  const emulator = join(sdk, "emulator", exe("emulator"));

  if (connectedDevices(adb).length === 0) {
    const name = process.env.ANDROID_AVD || DEFAULT_AVD;
    const avds = capture(emulator, ["-list-avds"], { env }).split("\n");
    if (!avds.includes(name)) createAvd(sdk, name, env);

    log(`Booting Android emulator "${name}"…`);
    spawn(emulator, ["-avd", name, "-no-snapshot-save", "-no-boot-anim"], {
      detached: true,
      stdio: "ignore",
      env,
    }).unref();
    capture(adb, ["wait-for-device"]);
    await waitForBoot(adb);
  }
  log(`Android device ready (${connectedDevices(adb)[0]?.split("\t")[0]})`);
  return env;
}
