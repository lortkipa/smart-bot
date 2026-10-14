import { useServerStatus } from "./lib/useServerStatus";
import lockup from "./lockup.svg";
import lockupDark from "./lockup-dark.svg";

const isDesktop = "__TAURI_INTERNALS__" in window;

export function App() {
  const { health, error, realtime } = useServerStatus();

  return (
    <main className="screen">
      <picture>
        <source srcSet={lockupDark} media="(prefers-color-scheme: dark)" />
        <img className="logo" src={lockup} alt="Smart Bot" />
      </picture>

      <dl className="status">
        <Row label="Client" value={isDesktop ? "desktop" : "web"} />
        <Row
          label="API"
          value={health ? `${health.status} · v${health.version}` : (error ?? "checking…")}
          ok={health?.status === "ok"}
        />
        <Row label="Database" value={health?.database ?? "…"} ok={health?.database === "ok"} />
        <Row label="Realtime" value={realtime} ok={realtime === "open"} />
      </dl>
    </main>
  );
}

function Row({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="row">
      <dt>{label}</dt>
      <dd>
        {ok !== undefined && <span className={ok ? "dot ok" : "dot"} />}
        {value}
      </dd>
    </div>
  );
}
