import { validateImageBuffer } from '../src/server/storageService';

async function testAllFormats() {
  console.log('Testing Universal Image Validation in storageService...');

  const samples = [
    {
      name: 'JPEG (0xFF, 0xD8, 0xFF)',
      buffer: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]),
      expectedExt: 'jpg',
      expectedMime: 'image/jpeg'
    },
    {
      name: 'PNG (0x89, 0x50, 0x4E, 0x47...)',
      buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]),
      expectedExt: 'png',
      expectedMime: 'image/png'
    },
    {
      name: 'WebP (RIFF....WEBP)',
      buffer: Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBPVP8 ')]),
      expectedExt: 'webp',
      expectedMime: 'image/webp'
    },
    {
      name: 'GIF (GIF87a / GIF89a)',
      buffer: Buffer.from('GIF89a\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00\x00\x00', 'binary'),
      expectedExt: 'gif',
      expectedMime: 'image/gif'
    },
    {
      name: 'BMP (BM header)',
      buffer: Buffer.concat([Buffer.from('BM'), Buffer.alloc(14)]),
      expectedExt: 'bmp',
      expectedMime: 'image/bmp'
    },
    {
      name: 'TIFF Little Endian (II*\\0)',
      buffer: Buffer.from([0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
      expectedExt: 'tiff',
      expectedMime: 'image/tiff'
    },
    {
      name: 'TIFF Big Endian (MM\\0*)',
      buffer: Buffer.from([0x4d, 0x4d, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x08, 0x00, 0x00, 0x00, 0x00]),
      expectedExt: 'tiff',
      expectedMime: 'image/tiff'
    },
    {
      name: 'AVIF (ftypavif)',
      buffer: Buffer.concat([
        Buffer.from([0x00, 0x00, 0x00, 0x1c]),
        Buffer.from('ftyp'),
        Buffer.from('avif'),
        Buffer.from([0x00, 0x00, 0x00, 0x00]),
        Buffer.from('avifmif1miaf')
      ]),
      expectedExt: 'avif',
      expectedMime: 'image/avif'
    },
    {
      name: 'HEIC (ftypheic)',
      buffer: Buffer.concat([
        Buffer.from([0x00, 0x00, 0x00, 0x18]),
        Buffer.from('ftyp'),
        Buffer.from('heic'),
        Buffer.from([0x00, 0x00, 0x00, 0x00]),
        Buffer.from('mif1')
      ]),
      expectedExt: 'heic',
      expectedMime: 'image/heic'
    }
  ];

  let failed = 0;
  for (const sample of samples) {
    const res = validateImageBuffer(sample.buffer);
    if (res.valid && res.detectedExt === sample.expectedExt && res.detectedMime === sample.expectedMime) {
      console.log(`[PASS] ✓ ${sample.name} -> ext: ${res.detectedExt}, mime: ${res.detectedMime}`);
    } else {
      console.error(`[FAIL] ✗ ${sample.name}`, res);
      failed++;
    }
  }

  // Test SVG rejection
  const svgRes = validateImageBuffer(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'));
  if (!svgRes.valid && svgRes.error?.includes('SVG files are excluded')) {
    console.log('[PASS] ✓ SVG correctly rejected with XSS warning');
  } else {
    console.error('[FAIL] ✗ SVG rejection failed', svgRes);
    failed++;
  }

  // Test Executable rejection
  const elfRes = validateImageBuffer(Buffer.from([0x7f, 0x45, 0x4c, 0x46, 1, 1, 1, 0, 0, 0, 0, 0]));
  if (!elfRes.valid && elfRes.error?.includes('Executable')) {
    console.log('[PASS] ✓ Executable ELF file correctly rejected');
  } else {
    console.error('[FAIL] ✗ Executable rejection failed', elfRes);
    failed++;
  }

  // Test HTML masquerading rejection
  const htmlRes = validateImageBuffer(Buffer.from('<!DOCTYPE html><html><head><script>alert(1)</script></head><body><h1>Fake</h1></body></html>'));
  if (!htmlRes.valid && htmlRes.error?.includes('Executable, script, or archive')) {
    console.log('[PASS] ✓ HTML document masquerading as image correctly rejected');
  } else {
    console.error('[FAIL] ✗ HTML rejection failed', htmlRes);
    failed++;
  }

  if (failed > 0) {
    process.exit(1);
  }
  console.log('\nAll 12 format validation and security boundary checks passed successfully.');
}

testAllFormats().catch(err => {
  console.error(err);
  process.exit(1);
});
