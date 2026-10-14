/**
 * vm-daemon: runs inside each user VM and executes agent actions (screenshot, mouse/keyboard,
 * shell, files) on behalf of the server's VM layer. Not implemented yet.
 */
export type VmAction =
  | { type: "screenshot" }
  | { type: "click"; x: number; y: number; button?: "left" | "right" | "middle" }
  | { type: "type"; text: string }
  | { type: "shell"; command: string };
