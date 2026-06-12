import { createHash } from 'crypto';

export function sha256Hex(input: string | Buffer): string {
  return createHash('sha256').update(input).digest('hex');
}

export function sha256Base64(input: string | Buffer): string {
  return createHash('sha256').update(input).digest('base64');
}

export function hexToBase64(hex: string): string {
  return Buffer.from(hex, 'hex').toString('base64');
}

export function base64Encode(input: string | Buffer): string {
  if (typeof input === 'string') {
    return Buffer.from(input, 'utf8').toString('base64');
  }
  return input.toString('base64');
}

export function base64Decode(input: string): string {
  return Buffer.from(input, 'base64').toString('utf8');
}
