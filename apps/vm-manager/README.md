# vm-manager

Host service that manages users' Firecracker microVMs: create, start, snapshot idle VMs, restore on demand, and attach each user's persistent disk. Needs `/dev/kvm` on the host, so it is not part of the Docker Compose stack yet.

Status: placeholder. Only the interface in `src/index.ts` exists.
