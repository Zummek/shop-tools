import assert from 'node:assert/strict';
import test from 'node:test';

import {
  parsePersistedSession,
  refreshTokenToSend,
  shouldAdoptPersistedTokens,
  shouldRetryRefresh,
} from '../src/features/smSystem/user/persistedSession.ts';

const persistRoot = (accessToken: string | null, refreshToken: string | null) =>
  JSON.stringify({
    smSystemUser: JSON.stringify({ accessToken, refreshToken, user: { id: 1 } }),
    _persist: JSON.stringify({ version: 1, rehydrated: true }),
  });

test('parsePersistedSession reads the nested redux-persist user slice', () => {
  const parsed = parsePersistedSession(persistRoot('access-new', 'refresh-new'));
  assert.deepEqual(parsed, {
    accessToken: 'access-new',
    refreshToken: 'refresh-new',
  });
});

test('parsePersistedSession returns null for garbage', () => {
  assert.equal(parsePersistedSession(null), null);
  assert.equal(parsePersistedSession('{'), null);
  assert.equal(parsePersistedSession(JSON.stringify({ other: 1 })), null);
});

test('refreshTokenToSend keeps the in-memory token when storage differs', () => {
  assert.equal(refreshTokenToSend('memory-new', 'stored-old'), 'memory-new');
  assert.equal(refreshTokenToSend(null, 'stored-only'), 'stored-only');
  assert.equal(refreshTokenToSend(null, null), null);
});

test('shouldAdoptPersistedTokens only fills a tab that has no refresh token', () => {
  const stored = { accessToken: 'access', refreshToken: 'stored' };
  assert.equal(shouldAdoptPersistedTokens(null, stored), true);
  assert.equal(shouldAdoptPersistedTokens('memory', stored), false);
  assert.equal(
    shouldAdoptPersistedTokens(null, { accessToken: null, refreshToken: 'stored' }),
    false,
  );
});

test('shouldRetryRefresh only when storage holds a different refresh token', () => {
  assert.equal(shouldRetryRefresh('old', 'rotated'), true);
  assert.equal(shouldRetryRefresh('old', 'old'), false);
  assert.equal(shouldRetryRefresh('old', null), false);
  assert.equal(shouldRetryRefresh('old', ''), false);
});
