const jwt = require('jsonwebtoken');

// Default JWT secret for local Supabase development
const JWT_SECRET = 'super-secret-jwt-token-with-at-least-32-characters-long';

// Claims for the service role key
const claims = {
  role: 'service_role',
  // Add other claims as needed
};

// Generate the service role token
const serviceRoleKey = jwt.sign(claims, JWT_SECRET, { expiresIn: '100y' }); // Long expiration for local dev

console.log('Generated service role key:', serviceRoleKey);