# vm-daemon

Small daemon baked into the VM image (`images/vm`). It executes agent actions inside the VM (screenshots, mouse and keyboard input, shell commands, file access). Only the server's VM layer talks to it; agents never reach it directly.

Status: placeholder. Only the action types in `src/index.ts` exist.
