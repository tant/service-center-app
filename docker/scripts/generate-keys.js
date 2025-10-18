#!/usr/bin/env node

/**
 * Generate Supabase API Keys
 *
 * Generates:
 *   - SUPABASE_ANON_KEY: For Docker Compose services (Kong, Analytics, etc.)
 *   - SUPABASE_SERVICE_ROLE_KEY: For server-side admin operations (bypasses RLS)
 *
 * Note: SUPABASE_ANON_KEY and NEXT_PUBLIC_SUPABASE_ANON_KEY have the SAME value.
 *       The setup script automatically sets both variables.
 *
 * Usage:
 *   node generate-keys.js <JWT_SECRET>
 *
 * Or set JWT_SECRET environment variable:
 *   JWT_SECRET="your-secret" node generate-keys.js
 *
 * The keys are JWT tokens signed with the JWT_SECRET and valid for 10 years.
 */

const jwt = require("jsonwebtoken");

const JWT_SECRET = process.argv[2] || process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("❌ Error: JWT_SECRET is required");
  console.error("");
  console.error("Usage:");
  console.error("  node generate-keys.js <JWT_SECRET>");
  console.error("  or");
  console.error('  JWT_SECRET="your-secret" node generate-keys.js');
  process.exit(1);
}

if (JWT_SECRET.length < 32) {
  console.error(
    "⚠️  Warning: JWT_SECRET should be at least 32 characters long for security",
  );
  console.error("");
}

console.log("🔑 Generating Supabase API Keys...\n");

// Generate ANON Key (for anonymous/public access)
const anonToken = jwt.sign(
  {
    role: "anon",
    iss: "supabase",
    iat: Math.floor(Date.now() / 1000),
  },
  JWT_SECRET,
  { expiresIn: "10y" },
);

// Generate SERVICE_ROLE Key (for server-side admin access)
const serviceToken = jwt.sign(
  {
    role: "service_role",
    iss: "supabase",
    iat: Math.floor(Date.now() / 1000),
  },
  JWT_SECRET,
  { expiresIn: "10y" },
);

console.log("✅ Keys generated successfully!\n");
console.log("Add these to your .env file:\n");
console.log("SUPABASE_ANON_KEY=" + anonToken);
console.log("");
console.log("SUPABASE_SERVICE_ROLE_KEY=" + serviceToken);
console.log("");
console.log(
  "⚠️  Keep SERVICE_ROLE_KEY secret - it bypasses all security rules!",
);
