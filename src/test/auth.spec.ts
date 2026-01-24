import { generateState, buildBasicAuth, buildExpiryTimestamp } from '../auth.js';

describe('auth', () => {
  describe('generateState', () => {
    it('generates a 32-character hex string', () => {
      const state = generateState();

      expect(state).toHaveLength(32);
      expect(state).toMatch(/^[0-9a-f]+$/);
    });

    it('generates different states on multiple calls', () => {
      const state1 = generateState();
      const state2 = generateState();
      const state3 = generateState();

      expect(state1).not.toBe(state2);
      expect(state2).not.toBe(state3);
      expect(state1).not.toBe(state3);
    });
  });

  describe('buildBasicAuth', () => {
    it('encodes client credentials in Basic auth format', () => {
      const auth = buildBasicAuth('client-id', 'client-secret');

      expect(auth).toMatch(/^Basic /);
      const encoded = auth.replace('Basic ', '');
      const decoded = atob(encoded);
      expect(decoded).toBe('client-id:client-secret');
    });

    it('handles special characters in credentials', () => {
      const auth = buildBasicAuth('client@id', 'secret:123');

      expect(auth).toMatch(/^Basic /);
      const encoded = auth.replace('Basic ', '');
      const decoded = atob(encoded);
      expect(decoded).toBe('client@id:secret:123');
    });
  });

  describe('buildExpiryTimestamp', () => {
    it('calculates expiry timestamp correctly', () => {
      const now = Date.now();
      const expiresIn = 3600; // 1 hour
      const expiry = buildExpiryTimestamp(expiresIn);

      expect(expiry).toBeGreaterThan(now);
      expect(expiry).toBeLessThanOrEqual(now + expiresIn * 1000 + 100); // Allow 100ms margin
    });

    it('handles zero expiry time', () => {
      const now = Date.now();
      const expiry = buildExpiryTimestamp(0);

      expect(expiry).toBeGreaterThanOrEqual(now);
      expect(expiry).toBeLessThanOrEqual(now + 100); // Allow 100ms margin
    });

    it('handles large expiry times', () => {
      const now = Date.now();
      const expiresIn = 86400 * 30; // 30 days
      const expiry = buildExpiryTimestamp(expiresIn);

      expect(expiry).toBeGreaterThan(now);
      expect(expiry).toBeLessThanOrEqual(now + expiresIn * 1000 + 100);
    });
  });
});
