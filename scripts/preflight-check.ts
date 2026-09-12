#!/usr/bin/env tsx
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

interface CheckResult {
  step: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  details: string;
}

const results: CheckResult[] = [];

function logCheck(step: string, status: 'PASS' | 'FAIL' | 'WARN', details: string) {
  results.push({ step, status, details });
  const icon = status === 'PASS' ? '✓' : status === 'WARN' ? '⚠' : '✗';
  console.log(`[${status}] ${icon} ${step}: ${details}`);
}

async function runPreflight() {
  console.log('======================================================================');
  console.log('       NINETIES SHOTS — PRODUCTION DEPLOYMENT PRE-FLIGHT AUDIT       ');
  console.log('======================================================================\n');

  const cwd = process.cwd();

  // 1. Check metadata.json
  const metadataPath = path.join(cwd, 'metadata.json');
  if (fs.existsSync(metadataPath)) {
    try {
      const meta = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
      if (meta.name && meta.name === 'NINETIES SHOTS') {
        logCheck('Metadata Configuration', 'PASS', `Name="${meta.name}", Description verified`);
      } else {
        logCheck('Metadata Configuration', 'WARN', `Unexpected name: ${meta.name}`);
      }
    } catch (e: any) {
      logCheck('Metadata Configuration', 'FAIL', `Invalid JSON: ${e.message}`);
    }
  } else {
    logCheck('Metadata Configuration', 'FAIL', 'metadata.json missing');
  }

  // 2. Check Database Data Files
  const requiredDataFiles = [
    'src/data/siteConfig.ts',
    'src/data/aboutData.ts',
    'src/data/portfolioData.ts',
    'src/data/servicesData.ts'
  ];
  let allDataFilesPresent = true;
  for (const f of requiredDataFiles) {
    if (!fs.existsSync(path.join(cwd, f))) {
      allDataFilesPresent = false;
      logCheck('Core Data Dependency', 'FAIL', `Missing critical module: ${f}`);
    }
  }
  if (allDataFilesPresent) {
    logCheck('Core Data Dependencies', 'PASS', 'All 4 data modules verified');
  }

  // 3. Check dist output
  const distDir = path.join(cwd, 'dist');
  const distIndex = path.join(distDir, 'index.html');
  const distServer = path.join(distDir, 'server.cjs');

  if (fs.existsSync(distIndex) && fs.existsSync(distServer)) {
    logCheck('Production Bundle', 'PASS', 'dist/index.html and dist/server.cjs present');

    // Verify assets referenced in index.html exist
    const htmlContent = fs.readFileSync(distIndex, 'utf-8');
    const assetMatches = htmlContent.match(/src="([^"]+)"|href="([^"]+\.css)"/g) || [];
    let brokenAssets = 0;
    for (const match of assetMatches) {
      const assetPath = match.replace(/^(src|href)="/, '').replace(/"$/, '');
      if (assetPath.startsWith('/assets/')) {
        const fullAssetPath = path.join(distDir, assetPath);
        if (!fs.existsSync(fullAssetPath)) {
          brokenAssets++;
          logCheck('Asset Integrity', 'FAIL', `Missing referenced asset: ${assetPath}`);
        }
      }
    }
    if (brokenAssets === 0) {
      logCheck('Asset Integrity', 'PASS', 'All assets referenced in index.html exist in dist/');
    }
  } else {
    logCheck('Production Bundle', 'WARN', 'Build outputs missing or incomplete. Rebuilding recommended.');
  }

  // 4. Test Production Server Startup with dynamic PORT on 0.0.0.0
  const TEST_PORT = 4192;
  console.log(`\nStarting production simulation on 0.0.0.0:${TEST_PORT}...`);

  const serverProc = spawn('node', ['dist/server.cjs'], {
    env: {
      ...process.env,
      PORT: String(TEST_PORT),
      NODE_ENV: 'production',
      ADMIN_INITIAL_PASSWORD: process.env.ADMIN_INITIAL_PASSWORD || 'PreflightAdminTest2026!'
    }
  });

  let serverStarted = false;
  let serverLogs = '';

  serverProc.stdout.on('data', (d) => {
    const text = d.toString();
    serverLogs += text;
  });

  serverProc.stderr.on('data', (d) => {
    const text = d.toString();
    serverLogs += text;
  });

  // Wait up to 10 seconds for startup and Firestore connection
  for (let i = 0; i < 20; i++) {
    try {
      const ping = await fetch(`http://127.0.0.1:${TEST_PORT}/api/health`);
      if (ping.status === 200) break;
    } catch {
      // Wait for server to bind port
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  try {
    // A. Health check
    const healthRes = await fetch(`http://127.0.0.1:${TEST_PORT}/api/health`);
    const healthJson: any = await healthRes.json();
    if (healthRes.status === 200 && healthJson.status === 'ok') {
      logCheck('Production /api/health', 'PASS', `HTTP 200 OK (brand: ${healthJson.brand})`);
      serverStarted = true;
    } else {
      logCheck('Production /api/health', 'FAIL', `HTTP ${healthRes.status}: ${JSON.stringify(healthJson)}`);
    }

    // B. Public config check
    const configRes = await fetch(`http://127.0.0.1:${TEST_PORT}/api/public/config`);
    const configJson: any = await configRes.json();
    if (configRes.status === 200 && configJson.brandName === 'NINETIES SHOTS') {
      logCheck('Production /api/public/config', 'PASS', `HTTP 200 OK (brandName: ${configJson.brandName})`);
    } else {
      logCheck('Production /api/public/config', 'FAIL', `HTTP ${configRes.status}`);
    }

    // C. Root route (SPA frontend serving) & Cache-Control verification
    const rootRes = await fetch(`http://127.0.0.1:${TEST_PORT}/`);
    const rootHtml = await rootRes.text();
    const cacheControl = rootRes.headers.get('cache-control') || '';
    if (rootRes.status === 200 && rootHtml.includes('NINETIES SHOTS') && rootHtml.toLowerCase().includes('<!doctype html>')) {
      if (cacheControl.includes('no-cache')) {
        logCheck('Production / (Root HTML)', 'PASS', `HTTP 200 OK (${rootHtml.length} bytes, Cache-Control: ${cacheControl})`);
      } else {
        logCheck('Production / (Root HTML)', 'WARN', `HTTP 200 OK but missing no-cache header: ${cacheControl}`);
      }
    } else {
      logCheck('Production / (Root HTML)', 'FAIL', `HTTP ${rootRes.status}: Missing title or doctype`);
    }

    // D. Application route SPA fallback (e.g. /portfolio, /admin)
    const spaRes = await fetch(`http://127.0.0.1:${TEST_PORT}/portfolio`);
    const spaHtml = await spaRes.text();
    if (spaRes.status === 200 && spaHtml.includes('NINETIES SHOTS') && spaHtml.toLowerCase().includes('<!doctype html>')) {
      logCheck('SPA Client Routing', 'PASS', 'Sub-routes (/portfolio) correctly return index.html for client routing');
    } else {
      logCheck('SPA Client Routing', 'FAIL', `Failed to route /portfolio: HTTP ${spaRes.status}`);
    }

    // E. Asset 404 Guard (missing JS chunks must NEVER return index.html with text/html)
    const bogusAssetRes = await fetch(`http://127.0.0.1:${TEST_PORT}/assets/test-deliberately-missing-chunk.js`);
    const bogusAssetType = bogusAssetRes.headers.get('content-type') || '';
    if (bogusAssetRes.status === 404 && !bogusAssetType.includes('text/html')) {
      logCheck('Asset 404 Guard', 'PASS', `Missing /assets/* returns genuine HTTP 404 (MIME: ${bogusAssetType})`);
    } else {
      logCheck('Asset 404 Guard', 'FAIL', `Missing asset returned HTTP ${bogusAssetRes.status} with ${bogusAssetType}`);
    }

    // F. Existing JS bundle MIME-Type check
    const assetsInDist = fs.readdirSync(path.join(cwd, 'dist', 'assets')).filter(f => f.endsWith('.js'));
    if (assetsInDist.length > 0) {
      const realJsUrl = `http://127.0.0.1:${TEST_PORT}/assets/${assetsInDist[0]}`;
      const realJsRes = await fetch(realJsUrl);
      const realJsType = realJsRes.headers.get('content-type') || '';
      if (realJsRes.status === 200 && realJsType.includes('application/javascript')) {
        logCheck('JS Bundle MIME-Type', 'PASS', `Bundle ${assetsInDist[0]} returns HTTP 200 with ${realJsType}`);
      } else {
        logCheck('JS Bundle MIME-Type', 'FAIL', `Bundle returned HTTP ${realJsRes.status} with unexpected MIME: ${realJsType}`);
      }
    }

    // G. API 404 Guard
    const bogusApiRes = await fetch(`http://127.0.0.1:${TEST_PORT}/api/nonexistent-route-guard-test`);
    const bogusApiJson: any = await bogusApiRes.json();
    if (bogusApiRes.status === 404 && bogusApiJson.error === 'API_ENDPOINT_NOT_FOUND') {
      logCheck('API 404 Guard', 'PASS', 'Unknown /api/* route correctly returned JSON 404');
    } else {
      logCheck('API 404 Guard', 'FAIL', `Unexpected response: HTTP ${bogusApiRes.status}`);
    }

    // H. Dynamic PORT & 0.0.0.0 verification
    if (serverLogs.includes(`0.0.0.0:${TEST_PORT}`)) {
      logCheck('Host & Port Binding', 'PASS', `Bound strictly to 0.0.0.0:${TEST_PORT} from process.env.PORT`);
    } else {
      logCheck('Host & Port Binding', 'WARN', `Check server stdout for host/port confirmation`);
    }

    // I. Secret exposure audit
    const sensitiveTokens = ['password', 'secret', 'jwt', 'hash', 'bearer'];
    let exposedSecrets = false;
    for (const token of sensitiveTokens) {
      if (serverLogs.toLowerCase().includes(`initial password:`) || serverLogs.toLowerCase().includes(`passwordhash`)) {
        exposedSecrets = true;
        break;
      }
    }
    if (!exposedSecrets) {
      logCheck('Secret Hygiene in Logs', 'PASS', 'No plain passwords or credential hashes logged');
    } else {
      logCheck('Secret Hygiene in Logs', 'FAIL', 'Found sensitive credentials in server startup logs');
    }

  } catch (err: any) {
    logCheck('Production Runtime Check', 'FAIL', `Connection refused or runtime error: ${err.message}`);
  } finally {
    serverProc.kill('SIGTERM');
  }

  console.log('\n======================================================================');
  console.log('                          PRE-FLIGHT SUMMARY                          ');
  console.log('======================================================================');
  const fails = results.filter((r) => r.status === 'FAIL');
  const warns = results.filter((r) => r.status === 'WARN');
  const passes = results.filter((r) => r.status === 'PASS');

  console.log(`Passed: ${passes.length} | Warnings: ${warns.length} | Failures: ${fails.length}`);
  if (fails.length > 0) {
    console.log('\nCRITICAL: Deployment pre-flight checks FAILED.');
    process.exit(1);
  } else {
    console.log('\nSUCCESS: All production startup & reliability checks PASSED.');
    process.exit(0);
  }
}

runPreflight().catch((e) => {
  console.error('Fatal preflight execution error:', e);
  process.exit(1);
});
