// QR Code verifier stub
export function verifyQR(code) {
  // Simple deterministic check
  const ok = code && code.startsWith('CYL-');
  return Promise.resolve({ code, valid: ok, message: ok? 'Verified' : 'Invalid code' });
}
