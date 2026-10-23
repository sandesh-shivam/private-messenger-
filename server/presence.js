/**
 * Presence state is persisted in the JSON store, while sockets are process-local.
 * These helpers reconcile persisted state after restarts and ignore disconnects
 * from a socket which is no longer the user's current socket.
 */

export function reconcileStalePresence(store, { persist = () => {} } = {}) {
  if (!store || !Array.isArray(store.users)) return 0;

  const now = new Date().toISOString();
  let reconciled = 0;

  for (const user of store.users) {
    if (user?.online === true) {
      user.online = false;
      user.lastSeen = now;
      reconciled += 1;
    }
  }

  if (reconciled > 0) persist(store);
  return reconciled;
}

export function markUserOfflineIfCurrent({
  store,
  socketsByUserId,
  userId,
  socketId = null,
  persist = () => {}
}) {
  const user = store?.users?.find((entry) => entry?.id === userId);
  if (!user) return false;

  const currentSocketId = socketsByUserId.get(userId);

  // A delayed disconnect event must never clear presence for a newer socket.
  if (socketId !== null && currentSocketId !== socketId) return false;

  const hasMappedSocket = currentSocketId !== undefined;
  if (user.online !== true && !hasMappedSocket) return false;

  user.online = false;
  user.lastSeen = new Date().toISOString();
  socketsByUserId.delete(userId);
  persist(store);
  return true;
}
