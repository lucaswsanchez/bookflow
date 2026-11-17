// Unambiguous alphabet: no 0/O, 1/I/L
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** Generates a short, human-friendly confirmation code such as `BF-7K3P9Q`. */
export function generateBookingCode(random: () => number = Math.random): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += ALPHABET[Math.floor(random() * ALPHABET.length)];
  }
  return `BF-${code}`;
}
