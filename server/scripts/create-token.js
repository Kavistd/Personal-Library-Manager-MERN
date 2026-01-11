// Utility: Generate a JWT for a given userId
const jwt = require('jsonwebtoken');
const path = require('path');
// Load env from server/.env explicitly so it works from any CWD
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const args = process.argv.slice(2);
const userId = args[0];

// Support optional expiry flag: --exp <duration> or --expires <duration>
let expiresIn = '7d';
for (let i = 1; i < args.length; i++) {
  if (args[i] === '--exp' || args[i] === '--expires' || args[i] === '-e') {
    if (args[i + 1]) expiresIn = args[i + 1];
  }
}

if (!process.env.JWT_SECRET) {
  console.error('Error: JWT_SECRET not set in environment (.env).');
  process.exit(1);
}

if (!userId) {
  console.error('Usage: node server/scripts/create-token.js <userId> [--exp <duration>]');
  console.error('Example: node server/scripts/create-token.js 507f1f77bcf86cd799439011 --exp 7d');
  process.exit(1);
}

try {
  const payload = { userId };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });

  console.log('JWT token:');
  console.log(token);
  console.log('\nPayload:', payload);
  console.log('Expires In:', expiresIn);
} catch (err) {
  console.error('Failed to create token:', err.message);
  process.exit(1);
}
