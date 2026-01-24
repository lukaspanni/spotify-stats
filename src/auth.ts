export const generateState = (): string => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

export const buildBasicAuth = (clientId: string, clientSecret: string): string => {
  const value = `${clientId}:${clientSecret}`;
  return `Basic ${encodeBase64(value)}`;
};

export const buildExpiryTimestamp = (expiresIn: number): number => {
  return Date.now() + expiresIn * 1000;
};

const encodeBase64 = (value: string): string => {
  if (isAscii(value)) return btoa(value);
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
};

const isAscii = (value: string): boolean => {
  for (let index = 0; index < value.length; index += 1) if (value.charCodeAt(index) > 0x7f) return false;
  return true;
};
