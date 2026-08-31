#!/usr/bin/env tsx
import { db } from '../src/server/db';

const newPassword = process.argv[2] || process.env.ADMIN_NEW_PASSWORD;

if (!newPassword || newPassword.trim().length < 8) {
  console.error('\n[ERROR] Usage: tsx scripts/reset-admin-password.ts <newPassword>');
  console.error('Password must be at least 8 characters long.\n');
  process.exit(1);
}

try {
  const success = db.resetAdminPassword(newPassword.trim(), 'admin');
  if (success) {
    console.log('\n======================================================================');
    console.log('[NINETIES SHOTS] Admin password reset successfully.');
    console.log('Username: admin');
    console.log('All previous admin sessions have been revoked.');
    console.log('======================================================================\n');
    process.exit(0);
  } else {
    console.error('[ERROR] Failed to find administrator account to reset.');
    process.exit(1);
  }
} catch (err: any) {
  console.error('[ERROR]', err.message);
  process.exit(1);
}
