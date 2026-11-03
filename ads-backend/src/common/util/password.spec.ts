import { describe, expect, it } from 'vitest';
import { hashPassword, needsRehash, verifyPassword } from './password.js';

describe('password hashing', () => {
  it('verifies the right password and rejects a wrong one', async () => {
    const hash = await hashPassword('correct horse battery');
    expect(await verifyPassword('correct horse battery', hash)).toBe(true);
    expect(await verifyPassword('correct horse batterz', hash)).toBe(false);
    expect(await verifyPassword('', hash)).toBe(false);
  });

  it('salts: the same password hashes differently each time, and never contains the password', async () => {
    const [a, b] = await Promise.all([hashPassword('same-password-1'), hashPassword('same-password-1')]);
    expect(a).not.toBe(b);
    expect(a).not.toContain('same-password-1');
    expect(a.startsWith('scrypt$')).toBe(true);
  });

  it('handles unicode and very long input', async () => {
    const unicode = 'pässwörd-日本語-🔑-long-enough';
    expect(await verifyPassword(unicode, await hashPassword(unicode))).toBe(true);
    const long = 'x'.repeat(10_000);
    expect(await verifyPassword(long, await hashPassword(long))).toBe(true);
  });

  it.each(['', 'plaintext', 'scrypt$1$2$3$a', 'bcrypt$12$abc$def$ghi$jkl', 'scrypt$x$y$z$aaaa$bbbb'])('rejects a malformed stored hash %j instead of throwing', async (stored) => {
    expect(await verifyPassword('anything', stored)).toBe(false);
    expect(needsRehash(stored)).toBe(true);
  });

  it('asks for a rehash only when the stored cost is below the current one', async () => {
    expect(needsRehash(await hashPassword('x-long-enough'))).toBe(false);
    const weak = `scrypt$1024$8$1$${Buffer.alloc(16).toString('base64url')}$${Buffer.alloc(64).toString('base64url')}`;
    expect(needsRehash(weak)).toBe(true);
  });
});
