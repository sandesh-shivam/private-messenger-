import test from 'node:test';
import assert from 'node:assert/strict';
import { markUserOfflineIfCurrent, reconcileStalePresence } from '../presence.js';

test('startup reconciliation clears persisted online flags and persists once', () => {
  const store = {
    users: [
      { id: 'u1', online: true, lastSeen: '2026-01-01T00:00:00.000Z', sessionId: 'keep-session' },
      { id: 'u2', online: false, lastSeen: '2026-01-02T00:00:00.000Z', sessionId: null },
      { id: 'u3', online: true, lastSeen: null, sessionId: null }
    ],
    messages: []
  };
  const persisted = [];

  const count = reconcileStalePresence(store, { persist: (value) => persisted.push(value) });

  assert.equal(count, 2);
  assert.equal(store.users[0].online, false);
  assert.equal(store.users[2].online, false);
  assert.ok(Number.isFinite(Date.parse(store.users[0].lastSeen)));
  assert.ok(Number.isFinite(Date.parse(store.users[2].lastSeen)));
  assert.equal(store.users[0].sessionId, 'keep-session');
  assert.equal(store.users[1].lastSeen, '2026-01-02T00:00:00.000Z');
  assert.equal(persisted.length, 1);
});

test('startup reconciliation is a no-op when every user is already offline', () => {
  const store = { users: [{ id: 'u1', online: false, lastSeen: null }] };
  let persistCount = 0;

  assert.equal(reconcileStalePresence(store, { persist: () => persistCount++ }), 0);
  assert.equal(persistCount, 0);
});

test('disconnect from an old socket cannot mark the replacement socket offline', () => {
  const store = { users: [{ id: 'u1', online: true, lastSeen: null }] };
  const socketsByUserId = new Map([['u1', 'socket-new']]);
  let persistCount = 0;

  const changed = markUserOfflineIfCurrent({
    store,
    socketsByUserId,
    userId: 'u1',
    socketId: 'socket-old',
    persist: () => persistCount++
  });

  assert.equal(changed, false);
  assert.equal(store.users[0].online, true);
  assert.equal(socketsByUserId.get('u1'), 'socket-new');
  assert.equal(persistCount, 0);
});

test('disconnect from the current socket marks user offline and removes its mapping', () => {
  const store = { users: [{ id: 'u1', online: true, lastSeen: null }] };
  const socketsByUserId = new Map([['u1', 'socket-current']]);
  let persistCount = 0;

  const changed = markUserOfflineIfCurrent({
    store,
    socketsByUserId,
    userId: 'u1',
    socketId: 'socket-current',
    persist: () => persistCount++
  });

  assert.equal(changed, true);
  assert.equal(store.users[0].online, false);
  assert.ok(Number.isFinite(Date.parse(store.users[0].lastSeen)));
  assert.equal(socketsByUserId.has('u1'), false);
  assert.equal(persistCount, 1);
});

test('missing users and already-offline users do not trigger writes', () => {
  const store = { users: [{ id: 'u1', online: false, lastSeen: null }] };
  const socketsByUserId = new Map();
  let persistCount = 0;

  assert.equal(markUserOfflineIfCurrent({
    store, socketsByUserId, userId: 'missing', socketId: 'unknown',
    persist: () => persistCount++
  }), false);
  assert.equal(markUserOfflineIfCurrent({
    store, socketsByUserId, userId: 'u1', socketId: null,
    persist: () => persistCount++
  }), false);
  assert.equal(persistCount, 0);
});
