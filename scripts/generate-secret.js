/**
 * Generates a secure random string for use as NEXTAUTH_SECRET
 * Run with: node scripts/generate-secret.js
 */

const crypto = require('crypto');

// Generate a 32-byte random string, base64 encoded
const secret = crypto.randomBytes(32).toString('base64');

console.log('\x1b[32m%s\x1b[0m', 'Generated NEXTAUTH_SECRET:');
console.log('\x1b[33m%s\x1b[0m', secret);
console.log('\x1b[32m%s\x1b[0m', '\nAdd this to your .env.local file and Vercel environment variables:');
console.log('\x1b[36m%s\x1b[0m', `NEXTAUTH_SECRET=${secret}`);