import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

export const SUPPORTED_IMAGE_FORMATS = [
  'JPEG / JPG',
  'PNG',
  'WebP',
  'GIF',
  'BMP',
  'TIFF / TIF',
  'AVIF',
  'HEIC / HEIF'
] as const;

export const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/pjpeg',
  'image/png',
  'image/x-png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/x-ms-bmp',
  'image/tiff',
  'image/x-tiff',
  'image/avif',
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence'
]);

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  storageProvider: 'cloudinary';
  browserNotice?: string;
  publicId?: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  detectedExt?: 'jpg' | 'png' | 'webp' | 'gif' | 'bmp' | 'tiff' | 'avif' | 'heic';
  detectedMime?: string;
  browserNotice?: string;
}

/**
 * Inspects binary magic numbers and format headers to validate authentic images
 * while strictly blocking executables, shell scripts, HTML/JS masquerading, and unsafe SVGs.
 */
export function validateImageBuffer(buffer: Buffer, claimedMime?: string): ValidationResult {
  if (!buffer || buffer.length === 0) {
    return { valid: false, error: 'Uploaded file is empty.' };
  }

  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: 'File size exceeds the maximum limit of 15MB.' };
  }

  if (claimedMime && !ALLOWED_MIME_TYPES.has(claimedMime.toLowerCase())) {
    if (claimedMime.toLowerCase().includes('svg')) {
      return {
        valid: false,
        error: 'SVG files are excluded for security reasons to prevent embedded active scripts and cross-site scripting (XSS). Please upload raster photograph formats (JPEG, PNG, WebP, GIF, BMP, TIFF, AVIF, HEIC).'
      };
    }
    return {
      valid: false,
      error: 'Invalid file MIME type. Supported formats: JPEG, PNG, WebP, GIF, BMP, TIFF, AVIF, HEIC.'
    };
  }

  if (buffer.length < 12) {
    return { valid: false, error: 'File is too small to be a valid image.' };
  }

  // Inspect the first 512 bytes for active content, HTML, SVG, scripts, or executables
  const headerPreview = buffer.toString('utf8', 0, Math.min(buffer.length, 512)).toLowerCase();

  // Explicit SVG detection & rejection to prevent XSS
  if (
    headerPreview.includes('<svg') ||
    (headerPreview.includes('<?xml') && headerPreview.includes('<svg')) ||
    headerPreview.includes('xmlns="http://www.w3.org/2000/svg"') ||
    headerPreview.includes("xmlns='http://www.w3.org/2000/svg'")
  ) {
    return {
      valid: false,
      error: 'SVG files are excluded for security reasons to prevent embedded active scripts and cross-site scripting (XSS). Please upload raster photograph formats (JPEG, PNG, WebP, GIF, BMP, TIFF, AVIF, HEIC).'
    };
  }

  // Active script, HTML, or executable binary signatures
  const isHtmlOrScript =
    headerPreview.includes('<!doctype html') ||
    headerPreview.includes('<html') ||
    headerPreview.includes('<script') ||
    headerPreview.startsWith('#!/');

  const isElf = buffer[0] === 0x7f && buffer[1] === 0x45 && buffer[2] === 0x4c && buffer[3] === 0x46;
  const isWindowsPE = buffer[0] === 0x4d && buffer[1] === 0x5a && buffer[2] !== 0x00; // 'MZ' executable
  const isZipOrArchive = buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04; // 'PK\x03\x04'

  if (isHtmlOrScript || isElf || isWindowsPE || isZipOrArchive) {
    return {
      valid: false,
      error: 'Executable, script, or archive file detected. Arbitrary file uploads masquerading as images are rejected.'
    };
  }

  // 1. JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, detectedExt: 'jpg', detectedMime: 'image/jpeg' };
  }

  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { valid: true, detectedExt: 'png', detectedMime: 'image/png' };
  }

  // 3. GIF: GIF87a or GIF89a
  const gifMagic = buffer.toString('ascii', 0, 6);
  if (gifMagic === 'GIF87a' || gifMagic === 'GIF89a') {
    return { valid: true, detectedExt: 'gif', detectedMime: 'image/gif' };
  }

  // 4. WebP: RIFF....WEBP
  if (
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return { valid: true, detectedExt: 'webp', detectedMime: 'image/webp' };
  }

  // 5. BMP: BM (0x42, 0x4D)
  if (buffer[0] === 0x42 && buffer[1] === 0x4d) {
    return { valid: true, detectedExt: 'bmp', detectedMime: 'image/bmp' };
  }

  // 6. TIFF / TIF: Little Endian II*\0 (0x49 0x49 0x2A 0x00) or Big Endian MM\0* (0x4D 0x4D 0x00 0x2A)
  const isTiffLE = buffer[0] === 0x49 && buffer[1] === 0x49 && buffer[2] === 0x2a && buffer[3] === 0x00;
  const isTiffBE = buffer[0] === 0x4d && buffer[1] === 0x4d && buffer[2] === 0x00 && buffer[3] === 0x2a;
  if (isTiffLE || isTiffBE) {
    return { valid: true, detectedExt: 'tiff', detectedMime: 'image/tiff' };
  }

  // 7 & 8. ISOBMFF formats: AVIF and HEIC / HEIF (box header starts with ftyp at byte offset 4)
  if (buffer.length >= 16 && buffer.toString('ascii', 4, 8) === 'ftyp') {
    const ftypBoxLen = buffer.readUInt32BE(0);
    const inspectLen = Math.min(buffer.length, Math.max(16, ftypBoxLen || 64));
    const ftypStr = buffer.toString('ascii', 8, inspectLen);

    if (ftypStr.includes('avif') || ftypStr.includes('avis')) {
      return { valid: true, detectedExt: 'avif', detectedMime: 'image/avif' };
    }

    if (
      ftypStr.includes('heic') ||
      ftypStr.includes('heix') ||
      ftypStr.includes('hevc') ||
      ftypStr.includes('hevx') ||
      ftypStr.includes('mif1') ||
      ftypStr.includes('msf1')
    ) {
      return {
        valid: true,
        detectedExt: 'heic',
        detectedMime: 'image/heic',
        browserNotice: 'Stored durably in Cloud Storage as HEIC. Note: native inline browser display requires Apple/Safari; desktop Chrome/Firefox may require conversion.'
      };
    }
  }

  return {
    valid: false,
    error: 'File contents do not match any supported image format. Supported formats: JPEG, PNG, WebP, GIF, BMP, TIFF, AVIF, HEIC. Disguised non-image files or arbitrary uploads are rejected.'
  };
}

/**
 * Resolves configuration parameters for Cloudinary.
 * The API key and API secret are read strictly from server-side environment variables.
 * Credentials are never hardcoded and never exposed to the client.
 */
export function getCloudinaryConfig(): {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  isConfigured: boolean;
} {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'nymr1jpy';
  const apiKey = process.env.CLOUDINARY_API_KEY || '';
  const apiSecret = process.env.CLOUDINARY_API_SECRET || '';
  const isConfigured = Boolean(cloudName && apiKey && apiSecret);

  return { cloudName, apiKey, apiSecret, isConfigured };
}

/**
 * Computes a SHA-1 signature according to the official Cloudinary REST API specification.
 * Serializes alphabetically sorted parameters into key1=val1&key2=val2, appends the API secret,
 * and produces a hexadecimal SHA-1 digest.
 */
export function generateCloudinarySignature(
  params: Record<string, string | number>,
  apiSecret: string
): string {
  const sortedKeys = Object.keys(params).sort();
  const serialized = sortedKeys.map((k) => `${k}=${params[k]}`).join('&');
  return crypto.createHash('sha1').update(serialized + apiSecret).digest('hex');
}

/**
 * Diagnostic status check for Cloudinary storage.
 * Reports active storage mode, cloud name, upload folder, configuration status,
 * and diagnostic details without exposing any sensitive credentials or secrets.
 */
export async function checkStorageStatus(): Promise<{
  available: boolean;
  activeStorageMode: 'cloudinary' | 'cloudinary_unavailable';
  storageProvider: 'cloudinary';
  cloudName: string;
  folder: string;
  configured: boolean;
  diagnosticInfo: string;
  error?: string;
  mode?: string;
  bucketName?: string;
}> {
  const { cloudName, isConfigured } = getCloudinaryConfig();
  const folder = 'nineties-shots/portfolio';

  if (isConfigured) {
    return {
      available: true,
      activeStorageMode: 'cloudinary',
      storageProvider: 'cloudinary',
      cloudName,
      folder,
      configured: true,
      diagnosticInfo: `Cloudinary media storage is configured and active for durable uploads (cloud: '${cloudName}', folder: '${folder}').`,
      mode: 'cloudinary'
    };
  }

  return {
    available: false,
    activeStorageMode: 'cloudinary_unavailable',
    storageProvider: 'cloudinary',
    cloudName,
    folder,
    configured: false,
    diagnosticInfo: `Cloudinary media storage requires server credentials (cloud: '${cloudName}', folder: '${folder}'). Server environment variables CLOUDINARY_API_KEY and/or CLOUDINARY_API_SECRET are not configured. Local storage fallback is strictly disabled in production.`,
    error: `Cloud media storage unavailable: Cloudinary is not configured. Please set the CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET server environment variables.`,
    mode: 'cloudinary_unavailable'
  };
}

/**
 * Uploads an authenticated image to Cloudinary using a SERVER-SIDE signed upload.
 * Stores portfolio images under 'nineties-shots/portfolio' and returns the secure HTTPS URL.
 * Local filesystem fallback is strictly disabled in production Cloud Run to prevent media loss.
 */
export async function uploadPortfolioImage(
  buffer: Buffer,
  originalFilename: string = 'image.jpg',
  claimedMime?: string
): Promise<UploadResult> {
  const validation = validateImageBuffer(buffer, claimedMime);
  if (!validation.valid || !validation.detectedExt || !validation.detectedMime) {
    throw new Error(validation.error || 'Invalid image file.');
  }

  const { cloudName, apiKey, apiSecret, isConfigured } = getCloudinaryConfig();
  const folder = 'nineties-shots/portfolio';

  if (!isConfigured) {
    throw new Error(
      `[PORTFOLIO UPLOAD ERROR] Cloud media storage unavailable: Cloudinary is not configured. Please set CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in server environment variables. Ephemeral local storage has been disabled to prevent data loss.`
    );
  }

  const ext = validation.detectedExt;
  const mime = validation.detectedMime;
  const uniqueToken = crypto.randomBytes(8).toString('hex');
  const publicId = `portfolio-${Date.now()}-${uniqueToken}`;
  const safeFilename = `${publicId}.${ext}`;
  const timestamp = Math.floor(Date.now() / 1000);

  const signature = generateCloudinarySignature(
    {
      folder,
      public_id: publicId,
      timestamp
    },
    apiSecret
  );

  const uploadEndpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  try {
    const formData = new FormData();
    const fileBlob = new Blob([buffer], { type: mime });
    formData.append('file', fileBlob, safeFilename);
    formData.append('api_key', apiKey);
    formData.append('timestamp', String(timestamp));
    formData.append('folder', folder);
    formData.append('public_id', publicId);
    formData.append('signature', signature);

    const response = await fetch(uploadEndpoint, {
      method: 'POST',
      body: formData
    });

    const responseData = await response.json().catch(() => ({}));

    if (!response.ok || !responseData.secure_url) {
      const errMsg = responseData.error?.message || response.statusText || 'Upload failed';
      throw new Error(errMsg);
    }

    const secureUrl: string = responseData.secure_url;

    return {
      url: secureUrl,
      filename: safeFilename,
      size: buffer.length,
      mimeType: mime,
      storageProvider: 'cloudinary',
      browserNotice: validation.browserNotice,
      publicId: responseData.public_id || `${folder}/${publicId}`
    };
  } catch (err: any) {
    console.error('[CLOUDINARY UPLOAD ERROR]', err.message);
    throw new Error(
      `[PORTFOLIO UPLOAD ERROR] Cloud media storage write failed: ${err.message || 'Unknown error'}.`
    );
  }
}

/**
 * Safely deletes an image from Cloudinary or local test storage if it belongs to our configured paths.
 * Ignores external URLs (e.g. Unsplash) and legacy URLs, failing gracefully without throwing.
 */
export async function deleteStorageImage(imageUrl?: string | null): Promise<boolean> {
  if (!imageUrl || typeof imageUrl !== 'string') return false;

  // Cloudinary image deletion
  if (imageUrl.includes('res.cloudinary.com')) {
    const { cloudName, apiKey, apiSecret, isConfigured } = getCloudinaryConfig();
    if (!isConfigured) return false;

    try {
      // Cloudinary URL structure:
      // https://res.cloudinary.com/<cloud>/image/upload/(v<version>/)?(nineties-shots/portfolio/[^.]+)
      const match = imageUrl.match(/\/image\/upload\/(?:v\d+\/)?([^\.]+)/);
      if (!match || !match[1]) return false;

      const publicId = decodeURIComponent(match[1]);
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = generateCloudinarySignature(
        {
          public_id: publicId,
          timestamp
        },
        apiSecret
      );

      const formData = new FormData();
      formData.append('public_id', publicId);
      formData.append('timestamp', String(timestamp));
      formData.append('api_key', apiKey);
      formData.append('signature', signature);

      const destroyEndpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`;
      const res = await fetch(destroyEndpoint, {
        method: 'POST',
        body: formData
      });
      const data = await res.json().catch(() => ({}));
      if (data.result === 'ok') {
        console.log(`[Storage] Deleted Cloudinary image: ${publicId}`);
        return true;
      }
    } catch (err: any) {
      console.warn(`[Storage] Non-fatal Cloudinary cleanup notice for '${imageUrl}':`, err.message);
    }
    return false;
  }

  // Local filesystem cleanup (for past test artifacts)
  if (imageUrl.startsWith('/uploads/portfolio/') || imageUrl.includes('/uploads/portfolio/')) {
    try {
      const cleanPath = imageUrl.split('?')[0];
      const filename = path.basename(cleanPath);
      const localFilePath = path.join(process.cwd(), 'uploads', 'portfolio', filename);
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
        console.log(`[Storage] Deleted local portfolio image file: ${filename}`);
        return true;
      }
    } catch (err: any) {
      console.warn(`[Storage] Non-fatal local cleanup notice for '${imageUrl}':`, err.message);
    }
    return false;
  }

  // External or legacy Firebase Storage URLs
  return false;
}

