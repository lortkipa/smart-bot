import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/main.ts"],
  format: "esm",
  platform: "node",
  target: "node22",
  clean: true,
  // Workspace packages ship TypeScript source, so bundle them (they are devDependencies for
  // that reason). Their own npm deps get bundled too; this package's dependencies stay external.
  noExternal: [/^@smart-bot\//],
});
