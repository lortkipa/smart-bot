/**
 * vm-manager: runs on the host (needs /dev/kvm). Creates, starts, snapshots and restores each
 * user's Firecracker microVM and its persistent disk. Not implemented yet.
 */
export interface VmManager {
  ensureRunning(userId: string): Promise<{ vmId: string }>;
  snapshotAndStop(userId: string): Promise<void>;
}
