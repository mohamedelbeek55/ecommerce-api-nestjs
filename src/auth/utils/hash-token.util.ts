import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Hashes a token (e.g. refresh token) using SHA-256.
 *
 * Why SHA-256 instead of bcrypt?
 * - bcrypt truncates input at 72 bytes, which is shorter than a JWT.
 *   Two different refresh tokens with the same first 72 bytes would
 *   produce the same hash — a critical security flaw for token rotation.
 * - Refresh tokens are already high-entropy random strings, so the slow,
 *   brute-force-resistant properties of bcrypt are unnecessary.
 *
 * Returns a hex-encoded 64-char digest.
 */
export function hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
}

/**
 * Constant-time comparison of a token against a stored hash.
 * Prevents timing attacks that could leak the stored hash character by character.
 */
export function compareTokenWithHash(token: string, storedHash: string): boolean {
    const tokenHash = hashToken(token);
    const tokenHashBuffer = Buffer.from(tokenHash, 'hex');
    const storedHashBuffer = Buffer.from(storedHash, 'hex');

    // timingSafeEqual throws if lengths differ
    if (tokenHashBuffer.length !== storedHashBuffer.length) {
        return false;
    }

    return timingSafeEqual(tokenHashBuffer, storedHashBuffer);
}