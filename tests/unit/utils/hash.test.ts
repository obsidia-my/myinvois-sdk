import { sha256Hex, sha256Base64, hexToBase64, base64Encode, base64Decode } from '../../../src/utils/hash';

describe('hash utils', () => {
  it('sha256Hex produces correct hex digest', () => {
    expect(sha256Hex('hello')).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
  });

  it('sha256Base64 produces correct base64 digest', () => {
    const hex = '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824';
    expect(sha256Base64('hello')).toBe(Buffer.from(hex, 'hex').toString('base64'));
  });

  it('hexToBase64 converts correctly', () => {
    expect(hexToBase64('68656c6c6f')).toBe(Buffer.from('hello').toString('base64'));
  });

  it('base64Encode encodes string', () => {
    expect(base64Encode('hello')).toBe('aGVsbG8=');
  });

  it('base64Decode decodes string', () => {
    expect(base64Decode('aGVsbG8=')).toBe('hello');
  });

  it('base64Encode handles Buffer input', () => {
    expect(base64Encode(Buffer.from('hello'))).toBe('aGVsbG8=');
  });
});
