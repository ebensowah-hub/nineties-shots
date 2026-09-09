#!/usr/bin/env tsx
import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = 3000;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function request(options: http.RequestOptions, body?: Buffer | string): Promise<{ status: number; data: any; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let chunks: Buffer[] = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf-8');
        let parsed = raw;
        try {
          parsed = JSON.parse(raw);
        } catch {}
        resolve({
          status: res.statusCode || 0,
          data: parsed,
          headers: res.headers
        });
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(body);
    }
    req.end();
  });
}

async function runTests() {
  console.log('======================================================================');
  console.log('       NINETIES SHOTS — P1 PERMANENT MEDIA STORAGE VALIDATION        ');
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(name: string, condition: boolean, details?: string) {
    if (condition) {
      console.log(`[PASS] ✓ ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ✗ ${name}${details ? ` - ${details}` : ''}`);
      failed++;
    }
  }

  // 1. Test unauthenticated upload rejection
  console.log('\n--- 1. Security & Authentication Checks ---');
  const unauthRes = await request({
    hostname: '127.0.0.1',
    port: PORT,
    path: '/api/admin/portfolio/upload',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ data: 'hello' }));

  assert('Unauthenticated upload returns 401 Unauthorized', unauthRes.status === 401);

  // 2. Obtain valid admin session and handle mustChangePassword if set
  console.log('\n--- 2. Admin Authentication ---');
  const adminPassword = process.env.ADMIN_RESET_PASSWORD || process.env.ADMIN_INITIAL_PASSWORD || 'PreflightAdminTest2026!';
  const loginRes = await request({
    hostname: '127.0.0.1',
    port: PORT,
    path: '/api/admin/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ username: 'admin', password: adminPassword }));

  assert('Admin login successful', loginRes.status === 200 && !!loginRes.data?.token);
  let token = loginRes.data?.token;

  if (!token) {
    console.error('Fatal: Cannot continue without admin token.');
    process.exit(1);
  }

  if (loginRes.data?.user?.mustChangePassword) {
    console.log('       mustChangePassword is active. Satisfying P0 password change policy...');
    const changePassRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/admin/change-password',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }, JSON.stringify({
      currentPassword: adminPassword,
      newPassword: adminPassword
    }));
    if (changePassRes.data?.token) {
      token = changePassRes.data.token;
    }
  }

  // 3. Test invalid file rejection (magic bytes check)
  console.log('\n--- 3. File Validation & Security Guards ---');
  const fakeImageBuffer = Buffer.from('NOT_AN_IMAGE_JUST_PLAIN_TEXT_PAYLOAD_FOR_TESTING');
  const fakeUploadRes = await request({
    hostname: '127.0.0.1',
    port: PORT,
    path: '/api/admin/portfolio/upload',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, JSON.stringify({
    filename: 'fake-image.jpg',
    mimeType: 'image/jpeg',
    data: fakeImageBuffer.toString('base64')
  }));

  assert('Fake image (disguised non-image file) is rejected with 400', fakeUploadRes.status === 400);

  // 3b. Test SVG rejection with XSS protection notice
  const svgBuffer = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert("xss")</script></svg>');
  const svgUploadRes = await request({
    hostname: '127.0.0.1',
    port: PORT,
    path: '/api/admin/portfolio/upload',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, JSON.stringify({
    filename: 'graphic.svg',
    mimeType: 'image/svg+xml',
    data: svgBuffer.toString('base64')
  }));

  assert(
    'SVG file is rejected with 400 to prevent script injection (XSS)',
    svgUploadRes.status === 400 && String(svgUploadRes.data?.error).includes('SVG files are excluded')
  );

  // 3c. Test executable ELF / script rejection
  const elfBuffer = Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00]);
  const elfUploadRes = await request({
    hostname: '127.0.0.1',
    port: PORT,
    path: '/api/admin/portfolio/upload',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, JSON.stringify({
    filename: 'danger.jpg',
    mimeType: 'image/jpeg',
    data: elfBuffer.toString('base64')
  }));

  assert(
    'Executable ELF file masquerading as image is rejected with 400',
    elfUploadRes.status === 400 && String(elfUploadRes.data?.error).includes('Executable')
  );

  // 4. Test oversized file rejection (> 15MB)
  const oversizedBuffer = Buffer.alloc(16 * 1024 * 1024, 0); // 16MB
  const oversizedRes = await request({
    hostname: '127.0.0.1',
    port: PORT,
    path: '/api/admin/portfolio/upload',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, JSON.stringify({
    filename: 'huge.jpg',
    mimeType: 'image/jpeg',
    data: oversizedBuffer.toString('base64')
  }));

  assert('Oversized file (> 15MB) is rejected with 400', oversizedRes.status === 400);

  // 5. Test Storage Diagnostic Status endpoint
  console.log('\n--- 4. Cloud Storage Diagnostics & Status ---');
  const storageStatusRes = await request({
    hostname: '127.0.0.1',
    port: PORT,
    path: '/api/admin/portfolio/storage-status',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  assert(
    'Admin can query /api/admin/portfolio/storage-status',
    storageStatusRes.status === 200 && typeof storageStatusRes.data?.available === 'boolean'
  );
  console.log(`       Configured Bucket: ${storageStatusRes.data?.bucketName}`);
  console.log(`       Storage Available: ${storageStatusRes.data?.available}`);
  if (storageStatusRes.data?.error) {
    console.log(`       Notice: ${storageStatusRes.data?.error}`);
  }

  // 6. Test Removal of Dangerous Local Fallback (Phase 12, Test 5)
  console.log('\n--- 5. Removal of Dangerous Local Fallback (Phase 12, Test 5) ---');
  const validJpeg = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
    0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
    0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
    0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20,
    0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29,
    0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32,
    0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
    0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00,
    0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
    0x09, 0x0a, 0x0b, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f,
    0x00, 0xbf, 0x00, 0xff, 0xd9
  ]);

  const uploadsDir = path.join(process.cwd(), 'uploads', 'portfolio');
  const countBefore = fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir).length : 0;

  const uploadAttemptRes = await request({
    hostname: '127.0.0.1',
    port: PORT,
    path: '/api/admin/portfolio/upload',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, JSON.stringify({
    filename: 'verification-sample.jpg',
    mimeType: 'image/jpeg',
    data: validJpeg.toString('base64')
  }));

  const countAfter = fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir).length : 0;

  if (storageStatusRes.data?.available) {
    // If Cloud Storage is available:
    assert(
      'Cloud Storage upload succeeds with durable URL',
      uploadAttemptRes.status === 200 && uploadAttemptRes.data?.storageProvider === 'firebase_storage'
    );
    assert(
      'Uploaded URL points to Cloud Storage / Firebase Storage',
      uploadAttemptRes.data?.url?.includes('storage.googleapis.com') ||
      uploadAttemptRes.data?.url?.includes('firebasestorage.googleapis.com')
    );
  } else {
    // When Cloud Storage is unavailable/not yet provisioned:
    assert(
      'Upload fails cleanly with descriptive error when Cloud Storage is unavailable',
      uploadAttemptRes.status === 400 && String(uploadAttemptRes.data?.error).includes('Cloud media storage unavailable')
    );
    assert(
      'NO files written to local ephemeral disk (zero silent fallback)',
      countAfter === countBefore,
      `Before: ${countBefore}, After: ${countAfter}`
    );
    assert(
      'API does not report false success for ephemeral local storage',
      uploadAttemptRes.data?.storageProvider !== 'local_fallback'
    );
  }

  // 7. Test Public Portfolio API and Curated Data Integrity
  console.log('\n--- 6. Public Portfolio & Curated Record Integrity ---');
  const publicPortfolioRes = await request({
    hostname: '127.0.0.1',
    port: PORT,
    path: '/api/public/portfolio',
    method: 'GET'
  });

  assert(
    'Public portfolio endpoint returns HTTP 200',
    publicPortfolioRes.status === 200 && Array.isArray(publicPortfolioRes.data)
  );
  assert(
    'Public portfolio contains the 6 curated editorial photographs',
    publicPortfolioRes.data?.length >= 6
  );

  const localPathsInDb = (publicPortfolioRes.data || []).filter((item: any) =>
    typeof item.image === 'string' && item.image.startsWith('/uploads/')
  );
  assert(
    'No portfolio records point to ephemeral /uploads/ paths',
    localPathsInDb.length === 0,
    `Found ${localPathsInDb.length} legacy local paths`
  );

  // 8. Test Portfolio Lifecycle & Safe Storage Cleanup Hooks
  console.log('\n--- 7. Portfolio Management & Safe Cleanup Hooks ---');
  const createRes = await request({
    hostname: '127.0.0.1',
    port: PORT,
    path: '/api/admin/portfolio',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, JSON.stringify({
    title: 'P1 Lifecycle Verification Exposure',
    category: 'editorial',
    categoryLabel: 'Editorial',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1600',
    thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600',
    alt: 'P1 Lifecycle Verification Alt',
    location: 'Accra Studio',
    date: '2026',
    description: 'Verifying portfolio CRUD and safe cleanup lifecycle.',
    featured: false,
    orientation: 'portrait'
  }));

  assert('Portfolio item created in Firestore', (createRes.status === 200 || createRes.status === 201) && !!createRes.data?.id);
  const createdId = createRes.data?.id;

  // Update item
  const updateRes = await request({
    hostname: '127.0.0.1',
    port: PORT,
    path: `/api/admin/portfolio/${createdId}`,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, JSON.stringify({
    title: 'P1 Lifecycle Verification (Updated Title)'
  }));

  assert('Portfolio item updated in Firestore', updateRes.status === 200 && updateRes.data?.title === 'P1 Lifecycle Verification (Updated Title)');

  // Clean up test item
  const deleteRes = await request({
    hostname: '127.0.0.1',
    port: PORT,
    path: `/api/admin/portfolio/${createdId}`,
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  assert('Portfolio item deleted with safe cleanup hook', deleteRes.status === 200);

  console.log('\n======================================================================');
  console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
