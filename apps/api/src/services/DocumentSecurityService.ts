import crypto from 'crypto';

export interface HashedPinCredentials {
  pinHash: string;
  salt: string;
  iterations: number;
}

export class DocumentSecurityService {
  private static readonly KEY_LEN = 64;
  private static readonly ITERATIONS = 10000;
  private static readonly DIGEST = 'sha512';

  /**
   * Hashes a numeric/alphanumeric PIN using PBKDF2 with a cryptographically secure random salt.
   * Emulates Mahavitran-style secured document access keys for RTO certificates and Bilties.
   */
  public static hashDocumentPin(pin: string): HashedPinCredentials {
    if (!pin || pin.length < 4) {
      throw new Error('PIN must be at least 4 characters/digits.');
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const derivedKey = crypto.pbkdf2Sync(
      pin,
      salt,
      this.ITERATIONS,
      this.KEY_LEN,
      this.DIGEST
    );

    return {
      pinHash: derivedKey.toString('hex'),
      salt,
      iterations: this.ITERATIONS
    };
  }

  /**
   * Verifies the provided user PIN against the stored hash and salt.
   */
  public static verifyDocumentPin(
    providedPin: string,
    storedHash: string,
    salt: string,
    iterations: number = this.ITERATIONS
  ): boolean {
    const derivedKey = crypto.pbkdf2Sync(
      providedPin,
      salt,
      iterations,
      this.KEY_LEN,
      this.DIGEST
    );

    const providedBuffer = Buffer.from(derivedKey.toString('hex'), 'hex');
    const storedBuffer = Buffer.from(storedHash, 'hex');

    if (providedBuffer.length !== storedBuffer.length) {
      return false;
    }

    // Timing-safe buffer comparison to prevent timing attacks
    return crypto.timingSafeEqual(providedBuffer, storedBuffer);
  }

  /**
   * Generates a tamper-proof SHA-256 receipt hash from document binary / file buffer.
   */
  public static computeReceiptHash(buffer: Buffer | string): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }
}
