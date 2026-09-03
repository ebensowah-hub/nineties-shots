import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

interface SubTestResult {
  name: string;
  passed: boolean;
  message: string;
}

const results: SubTestResult[] = [];

function record(name: string, passed: boolean, message: string) {
  results.push({ name, passed, message });
  console.log(`[${passed ? 'PASS' : 'FAIL'}] ${name}: ${message}`);
}

async function runServerWithTimeout(env: Record<string, string>, durationMs: number = 2200): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    const proc = spawn('node', ['dist/server.cjs'], {
      env: {
        ...process.env,
        ...env
      }
    });

    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });

    setTimeout(() => {
      proc.kill('SIGTERM');
      resolve({ stdout, stderr });
    }, durationMs);
  });
}

async function runAllFirstBootTests() {
  console.log('======================================================================');
  console.log('            FIRST-BOOT ISOLATED DATABASE VERIFICATION SUITE           ');
  console.log('======================================================================\n');

  const testBaseDir = path.join(process.cwd(), 'temp_first_boot_test');
  if (fs.existsSync(testBaseDir)) {
    fs.rmSync(testBaseDir, { recursive: true, force: true });
  }
  fs.mkdirSync(testBaseDir, { recursive: true });

  const testDbFile = path.join(testBaseDir, 'ninetiesshots_db.json');
  const PORT_A = '4194';
  const PORT_B = '4195';
  const PORT_D = '4196';

  // ------------------------------------------------------------------------
  // TEST A: Fresh database with no admin password supplied
  // ------------------------------------------------------------------------
  console.log('--- TEST A: Fresh Database (Zero Credentials Supplied) ---');
  const runA = await runServerWithTimeout({
    PORT: PORT_A,
    NODE_ENV: 'production',
    DATA_DIR_PATH: testBaseDir,
    DB_FILE_PATH: testDbFile,
    ADMIN_INITIAL_PASSWORD: '',
    ADMIN_RESET_PASSWORD: ''
  });

  const hasDbA = fs.existsSync(testDbFile);
  const stdoutA = runA.stdout;
  const matchA = stdoutA.match(/Initial Password:\s*(NS-[a-f0-9]+)/);
  const capturedPassword = matchA ? matchA[1] : null;

  const printedOnceA = stdoutA.includes('Initial Password:') &&
    stdoutA.includes('SAVE THIS PASSWORD NOW — IT WILL NOT BE SHOWN AGAIN.');

  if (hasDbA && capturedPassword && printedOnceA) {
    record('Test A — Database Creation & Disclosure', true, `Generated password "${capturedPassword}" printed with one-time warning`);
  } else {
    record('Test A — Database Creation & Disclosure', false, `Failed to initialize or output initial password. stdout: ${stdoutA}`);
  }

  // Verify usability of captured password for login & must-change-password
  let testAPasswordWorks = false;
  let mustChangeA = false;
  if (hasDbA && capturedPassword) {
    try {
      const dbContentA = JSON.parse(fs.readFileSync(testDbFile, 'utf-8'));
      const adminA = dbContentA.adminUsers[0];
      const bcryptMatch = bcrypt.compareSync(capturedPassword, adminA.passwordHash);
      mustChangeA = adminA.mustChangePassword === true;
      testAPasswordWorks = bcryptMatch && mustChangeA;
    } catch (e: any) {
      console.error('Error reading db A:', e);
    }
  }

  record('Test A — Password Usability & Must-Change Flag', testAPasswordWorks, `Bcrypt verified: ${testAPasswordWorks}, mustChangePassword: ${mustChangeA}`);

  // ------------------------------------------------------------------------
  // TEST B: Restart existing database
  // ------------------------------------------------------------------------
  console.log('\n--- TEST B: Restart With Existing Database ---');
  const runB = await runServerWithTimeout({
    PORT: PORT_B,
    NODE_ENV: 'production',
    DATA_DIR_PATH: testBaseDir,
    DB_FILE_PATH: testDbFile,
    ADMIN_INITIAL_PASSWORD: '',
    ADMIN_RESET_PASSWORD: ''
  });

  const stdoutB = runB.stdout;
  const noNewPasswordB = !stdoutB.includes('Initial Password:') &&
    !stdoutB.includes('INITIAL ADMINISTRATOR ACCOUNT PROVISIONED');

  let adminStillUsableB = false;
  if (hasDbA && capturedPassword) {
    try {
      const dbContentB = JSON.parse(fs.readFileSync(testDbFile, 'utf-8'));
      const adminB = dbContentB.adminUsers[0];
      adminStillUsableB = bcrypt.compareSync(capturedPassword, adminB.passwordHash);
    } catch (e: any) {
      console.error('Error reading db B:', e);
    }
  }

  record('Test B — Restart Silent & Retains Admin', noNewPasswordB && adminStillUsableB, `No password re-printed: ${noNewPasswordB}, original password still valid: ${adminStillUsableB}`);

  // ------------------------------------------------------------------------
  // TEST C: Plaintext persistence check
  // ------------------------------------------------------------------------
  console.log('\n--- TEST C: Plaintext Persistence Audit ---');
  let plainPersisted = false;
  if (hasDbA && capturedPassword) {
    const rawDbA = fs.readFileSync(testDbFile, 'utf-8');
    plainPersisted = rawDbA.includes(capturedPassword);
  }

  record('Test C — Zero Plaintext In Database', !plainPersisted, `Database contains only salted hashes; plain initial password absent: ${!plainPersisted}`);

  // ------------------------------------------------------------------------
  // TEST D: Fresh database with explicit ADMIN_INITIAL_PASSWORD
  // ------------------------------------------------------------------------
  console.log('\n--- TEST D: Explicit ADMIN_INITIAL_PASSWORD Provided ---');
  const explicitTestDir = path.join(process.cwd(), 'temp_explicit_test');
  if (fs.existsSync(explicitTestDir)) {
    fs.rmSync(explicitTestDir, { recursive: true, force: true });
  }
  fs.mkdirSync(explicitTestDir, { recursive: true });
  const testDbFileD = path.join(explicitTestDir, 'ninetiesshots_db.json');
  const explicitPassword = 'CustomExplicitAdminSecret2026!';

  const runD = await runServerWithTimeout({
    PORT: PORT_D,
    NODE_ENV: 'production',
    DATA_DIR_PATH: explicitTestDir,
    DB_FILE_PATH: testDbFileD,
    ADMIN_INITIAL_PASSWORD: explicitPassword,
    ADMIN_RESET_PASSWORD: ''
  });

  const stdoutD = runD.stdout;
  const noRandomGeneratedD = !stdoutD.includes('Initial Password:') &&
    !stdoutD.includes('SAVE THIS PASSWORD NOW');

  let explicitPasswordWorksD = false;
  if (fs.existsSync(testDbFileD)) {
    try {
      const dbContentD = JSON.parse(fs.readFileSync(testDbFileD, 'utf-8'));
      const adminD = dbContentD.adminUsers[0];
      explicitPasswordWorksD = bcrypt.compareSync(explicitPassword, adminD.passwordHash);
    } catch (e: any) {
      console.error('Error reading db D:', e);
    }
  }

  record('Test D — Explicit Password Respected Without Random Generation', noRandomGeneratedD && explicitPasswordWorksD, `Supplied password matched hash: ${explicitPasswordWorksD}, no random password printed: ${noRandomGeneratedD}`);

  // Cleanup test directories
  try {
    fs.rmSync(testBaseDir, { recursive: true, force: true });
    fs.rmSync(explicitTestDir, { recursive: true, force: true });
  } catch {}

  console.log('\n======================================================================');
  const allPassed = results.every(r => r.passed);
  console.log(`TOTAL SUB-TESTS: ${results.length} | PASSED: ${results.filter(r => r.passed).length} | FAILED: ${results.filter(r => !r.passed).length}`);
  if (allPassed) {
    console.log('SUCCESS: All 4 first-boot password tests PASSED.');
    process.exit(0);
  } else {
    console.log('CRITICAL: First-boot password tests FAILED.');
    process.exit(1);
  }
}

runAllFirstBootTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
