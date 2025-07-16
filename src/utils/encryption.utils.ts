import CryptoJS from 'crypto-js';

/**
 * Environment variable encryption utilities
 * Provides secure handling of sensitive environment variables
 */

export class EnvironmentEncryption {
  private static readonly ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';

  /**
   * Encrypt sensitive data
   */
  static encrypt(text: string): string {
    if (!text) return '';
    
    try {
      return CryptoJS.AES.encrypt(text, this.ENCRYPTION_KEY).toString();
    } catch (error) {
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt sensitive data
   */
  static decrypt(encryptedText: string): string {
    if (!encryptedText) return '';
    
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedText, this.ENCRYPTION_KEY);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      throw new Error('Decryption failed');
    }
  }

  /**
   * Securely get environment variable with optional decryption
   */
  static getSecureEnvVar(key: string, encrypted: boolean = false): string | undefined {
    const value = process.env[key];
    if (!value) return undefined;

    if (encrypted) {
      try {
        return this.decrypt(value);
      } catch (error) {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Mask sensitive data for logging
   */
  static maskSensitiveData(data: string, visibleChars: number = 4): string {
    if (!data || data.length <= visibleChars) {
      return '*'.repeat(8);
    }
    
    const maskedLength = data.length - visibleChars;
    const visiblePart = data.slice(0, visibleChars);
    const maskedPart = '*'.repeat(Math.min(maskedLength, 20));
    
    return `${visiblePart}${maskedPart}`;
  }
}
