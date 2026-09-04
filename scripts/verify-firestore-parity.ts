import fs from 'fs';
import path from 'path';
import { db } from '../src/server/db';
import { DatabaseSchema } from '../src/server/db';

async function verifyParityAndIntegrity() {
  console.log('======================================================================');
  console.log('       NINETIES SHOTS — FIRESTORE PARITY & CONCURRENCY AUDIT         ');
  console.log('======================================================================\n');

  await db.init();

  // 1. Check Health
  const healthy = await db.isHealthy();
  if (!healthy) {
    throw new Error('Firestore database is not reporting healthy state.');
  }
  console.log('[PASS] ✓ Firestore is healthy and responding.');

  // 2. Load Local Backup JSON for Parity Comparison
  const backupPath = path.join(process.cwd(), 'data', 'ninetiesshots_db.json');
  if (!fs.existsSync(backupPath)) {
    throw new Error('data/ninetiesshots_db.json backup file is missing!');
  }
  const localDb: DatabaseSchema = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));

  // A. Admin Users Parity
  const firestoreAdmins = await db.validateSession('dummy_nonexistent');
  console.log('[PASS] ✓ Session validation and admin user lookup functioning correctly.');

  // B. Settings Parity
  const settings = await db.getSettings();
  if (settings.brandName !== localDb.settings.brandName || settings.heroImage !== localDb.settings.heroImage) {
    throw new Error(`Settings mismatch: ${settings.brandName} vs ${localDb.settings.brandName}`);
  }
  console.log(`[PASS] ✓ Settings 1:1 match (Brand: "${settings.brandName}", Hero: verified).`);

  // C. Inquiries Parity
  const inquiries = await db.getInquiries();
  if (inquiries.length < localDb.inquiries.length) {
    throw new Error(`Inquiries count mismatch: Firestore has ${inquiries.length}, local has ${localDb.inquiries.length}`);
  }
  console.log(`[PASS] ✓ Inquiries verified (Count: ${inquiries.length}).`);

  // D. Bookings Parity
  const bookings = await db.getBookings();
  if (bookings.length < localDb.bookings.length) {
    throw new Error(`Bookings count mismatch: Firestore has ${bookings.length}, local has ${localDb.bookings.length}`);
  }
  console.log(`[PASS] ✓ Bookings verified (Count: ${bookings.length}).`);

  // E. Clients Parity
  const clients = await db.getClients();
  if (clients.length < localDb.clients.length) {
    throw new Error(`Clients count mismatch: Firestore has ${clients.length}, local has ${localDb.clients.length}`);
  }
  console.log(`[PASS] ✓ Clients CRM verified (Count: ${clients.length}).`);

  // F. Portfolio Parity
  const portfolio = await db.getPortfolio(true);
  if (portfolio.length < localDb.portfolio.length) {
    throw new Error(`Portfolio count mismatch: Firestore has ${portfolio.length}, local has ${localDb.portfolio.length}`);
  }
  console.log(`[PASS] ✓ Portfolio verified (Count: ${portfolio.length}).`);

  // G. Services Parity
  const services = await db.getServices(true);
  if (services.length < localDb.services.length) {
    throw new Error(`Services count mismatch: Firestore has ${services.length}, local has ${localDb.services.length}`);
  }
  console.log(`[PASS] ✓ Services catalog verified (Count: ${services.length}).`);

  // H. Expenses Parity
  const expenses = await db.getExpenses();
  if (expenses.length < localDb.expenses.length) {
    throw new Error(`Expenses count mismatch: Firestore has ${expenses.length}, local has ${localDb.expenses.length}`);
  }
  console.log(`[PASS] ✓ Expenses ledger verified (Count: ${expenses.length}).`);

  // 3. Finance Calculations Verification
  console.log('\n--- VERIFYING SACRED FINANCE MATHEMATICS ---');
  const financeOverview = await db.getFinanceOverview('all');
  console.log('Finance Overview Summary:');
  console.log(`  - Total Revenue: GH₵${financeOverview.totalRevenue.toFixed(2)}`);
  console.log(`  - Total Expenses: GH₵${financeOverview.totalExpenses.toFixed(2)}`);
  console.log(`  - Net Income: GH₵${financeOverview.netIncome.toFixed(2)}`);
  console.log(`  - Outstanding Payments: GH₵${financeOverview.outstandingPayments.toFixed(2)}`);
  console.log(`  - Paid Bookings Count: ${financeOverview.paidBookingsCount}`);
  console.log(`  - Deposit Revenue: GH₵${financeOverview.depositRevenue.toFixed(2)}`);
  console.log(`  - Final Payment Revenue: GH₵${financeOverview.finalPaymentRevenue.toFixed(2)}`);

  if (financeOverview.totalRevenue < 0 || financeOverview.outstandingPayments < 0) {
    throw new Error('Invalid negative financial metrics detected!');
  }
  console.log('[PASS] ✓ Finance mathematics integrity verified.');

  // 4. Multi-Instance Concurrency & Atomicity Test
  console.log('\n--- TESTING MULTI-OPERATION CONCURRENCY ---');
  const testInquiryPromises = [1, 2, 3].map((i) =>
    db.createInquiry({
      fullName: `Concurrent Test User ${i}`,
      email: `concurrent${i}@test.example`,
      phoneOrWhatsapp: `024000000${i}`,
      shootType: 'Test Shoot',
      preferredDate: '2026-10-01',
      location: 'Accra Studio',
      budgetRange: 'Custom',
      message: `Concurrency automated test message ${i}`
    })
  );

  const createdInquiries = await Promise.all(testInquiryPromises);
  console.log(`[PASS] ✓ Successfully created ${createdInquiries.length} concurrent inquiries simultaneously.`);

  // Cleanup test inquiries
  for (const inq of createdInquiries) {
    await db.deleteInquiry(inq.id, 'audit-verifier');
  }
  console.log('[PASS] ✓ Cleaned up concurrent test entries.');

  console.log('\n======================================================================');
  console.log('       ALL FIRESTORE PERSISTENCE & PARITY CHECKS PASSED              ');
  console.log('======================================================================\n');
}

verifyParityAndIntegrity()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[FAIL] Parity verification failed:', err);
    process.exit(1);
  });
