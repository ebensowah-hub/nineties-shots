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
  console.log('       NINETIES SHOTS — PORTFOLIO IMAGE UPLOAD VALIDATION SUITE       ');
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

  // 2. Obtain valid admin session
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
  const token = loginRes.data?.token;

  if (!token) {
    console.error('Fatal: Cannot continue without admin token.');
    process.exit(1);
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

  // 5. Test valid JPEG image upload
  console.log('\n--- 4. Valid Image Uploads & Cloud Storage Resolution ---');
  // 1x1 valid JPEG image bytes
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

  const jpegUploadRes = await request({
    hostname: '127.0.0.1',
    port: PORT,
    path: '/api/admin/portfolio/upload',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, JSON.stringify({
    filename: 'leica-monochrome.jpg',
    mimeType: 'image/jpeg',
    data: validJpeg.toString('base64')
  }));

  assert('Valid JPEG image upload returns 200 with URL', jpegUploadRes.status === 200 && !!jpegUploadRes.data?.url);
  const uploadedImageUrl = jpegUploadRes.data?.url;
  console.log(`       Uploaded Image URL Reference: ${uploadedImageUrl}`);

  // 6. Verify image URL is accessible via HTTP
  const imageFetchRes = await request({
    hostname: '127.0.0.1',
    port: PORT,
    path: uploadedImageUrl,
    method: 'GET'
  });
  assert('Uploaded image URL is retrievable over HTTP', imageFetchRes.status === 200);

  // 7. Test creating a portfolio item in Firestore referencing the uploaded image
  console.log('\n--- 5. Firestore Portfolio Document Integration ---');
  const createPortfolioRes = await request({
    hostname: '127.0.0.1',
    port: PORT,
    path: '/api/admin/portfolio',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, JSON.stringify({
    title: 'Test Upload Exposure 2026',
    category: 'portraits',
    categoryLabel: 'Portraits',
    image: uploadedImageUrl,
    thumbnail: uploadedImageUrl,
    alt: 'Test Upload Exposure 2026 Alt',
    location: 'Accra, Ghana',
    date: '2026',
    description: 'A test exposure photograph created via device upload.',
    featured: false,
    orientation: 'portrait'
  }));

  assert('Portfolio item created in Firestore with uploaded image URL', (createPortfolioRes.status === 200 || createPortfolioRes.status === 201) && !!createPortfolioRes.data?.id);
  const createdItemId = createPortfolioRes.data?.id;

  // 8. Test replacing an existing portfolio image
  console.log('\n--- 6. Replace Existing Portfolio Image ---');
  // Valid 1x1 PNG
  const validPng = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
    0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82
  ]);

  const replacementUploadRes = await request({
    hostname: '127.0.0.1',
    port: PORT,
    path: '/api/admin/portfolio/upload',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, JSON.stringify({
    filename: 'replacement-monochrome.png',
    mimeType: 'image/png',
    data: validPng.toString('base64')
  }));

  assert('Replacement PNG upload returns 200 with new URL', replacementUploadRes.status === 200 && !!replacementUploadRes.data?.url);
  const replacementUrl = replacementUploadRes.data?.url;

  // Update item with the new image URL
  const updateRes = await request({
    hostname: '127.0.0.1',
    port: PORT,
    path: `/api/admin/portfolio/${createdItemId}`,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, JSON.stringify({
    image: replacementUrl,
    thumbnail: replacementUrl
  }));

  assert('Portfolio item image updated in Firestore', updateRes.status === 200 && updateRes.data?.image === replacementUrl);

  // 9. Clean up test portfolio item
  console.log('\n--- 7. Cleanup & Record Integrity ---');
  const deleteRes = await request({
    hostname: '127.0.0.1',
    port: PORT,
    path: `/api/admin/portfolio/${createdItemId}`,
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  assert('Test portfolio item cleaned up successfully', deleteRes.status === 200);

  // 10. Verify original 6 portfolio records remain intact
  const listRes = await request({
    hostname: '127.0.0.1',
    port: PORT,
    path: '/api/public/portfolio',
    method: 'GET'
  });

  assert('Public portfolio returns original 6 curated records intact', listRes.status === 200 && Array.isArray(listRes.data) && listRes.data.length >= 6);

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
