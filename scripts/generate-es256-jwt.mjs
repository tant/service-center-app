#!/usr/bin/env node
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// ES256 private key from GoTrue (JWK format)
const jwk = {
  kty: "EC",
  kid: "b81269f1-21d8-4f2e-b719-c2240a840d90",
  use: "sig",
  key_ops: ["sign", "verify"],
  alg: "ES256",
  ext: true,
  d: "dIhR8wywJlqlua4y_yMq2SLhlFXDZJBCvFrY1DCHyVU",
  crv: "P-256",
  x: "M5Sjqn5zwC9Kl1zVfUUGvv9boQjCGd45G8sdopBExB4",
  y: "P6IXMvA2WYXSHSOMTBH2jsw_9rrzGy89FjPf6oOsIxQ"
};

// Convert JWK to PEM format for signing
function jwkToPem(jwk) {
  // EC private key in DER format
  const d = Buffer.from(jwk.d, 'base64url');
  const x = Buffer.from(jwk.x, 'base64url');
  const y = Buffer.from(jwk.y, 'base64url');

  // P-256 curve OID: 1.2.840.10045.3.1.7
  const curveOid = Buffer.from([0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07]);

  // Build ECPrivateKey structure
  const version = Buffer.from([0x02, 0x01, 0x01]); // INTEGER 1
  const privateKeyOctet = Buffer.concat([
    Buffer.from([0x04, d.length]), // OCTET STRING
    d
  ]);
  const curveOidWrapped = Buffer.concat([
    Buffer.from([0xa0, curveOid.length]), // [0] EXPLICIT
    curveOid
  ]);
  const publicKeyBit = Buffer.concat([
    Buffer.from([0xa1, 0x44]), // [1] EXPLICIT + length
    Buffer.from([0x03, 0x42, 0x00]), // BIT STRING
    Buffer.from([0x04]), // uncompressed point
    x,
    y
  ]);

  const sequence = Buffer.concat([
    version,
    privateKeyOctet,
    curveOidWrapped,
    publicKeyBit
  ]);

  const der = Buffer.concat([
    Buffer.from([0x30, sequence.length]), // SEQUENCE
    sequence
  ]);

  // Convert to PEM
  const base64 = der.toString('base64');
  const pem = [
    '-----BEGIN EC PRIVATE KEY-----',
    base64.match(/.{1,64}/g).join('\n'),
    '-----END EC PRIVATE KEY-----'
  ].join('\n');

  return pem;
}

try {
  const privateKeyPem = jwkToPem(jwk);

  // JWT payload
  const payload = {
    iss: "http://127.0.0.1:54321/auth/v1",
    role: "service_role",
    exp: 1983812996 // Expires 2032-11-25
  };

  // Generate JWT with ES256
  const token = jwt.sign(payload, privateKeyPem, {
    algorithm: 'ES256',
    keyid: jwk.kid
  });

  console.log('\n✅ ES256 JWT Generated Successfully!\n');
  console.log('Token:');
  console.log(token);
  console.log('\nDecoded Header:');
  console.log(JSON.stringify(jwt.decode(token, { complete: true }).header, null, 2));
  console.log('\nDecoded Payload:');
  console.log(JSON.stringify(jwt.decode(token).payload, null, 2));

} catch (error) {
  console.error('❌ Error generating JWT:', error.message);
  process.exit(1);
}
