import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import * as adminApp from 'firebase-admin/app';
import * as adminStorage from 'firebase-admin/storage';

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
  storageProvider: 'firebase_storage' | 'cloud_storage';
  browserNotice?: string;
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
 * Resolves configuration parameters for Google Cloud / Firebase Storage.
 */
export function getStorageBucketConfig(): {
  bucketName: string;
  projectId: string;
} {
  let bucketName = process.env.STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || process.env.GCS_BUCKET || '';
  let projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCP_PROJECT || '';

  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (!bucketName && config.storageBucket) {
        bucketName = config.storageBucket;
      }
      if (!projectId && config.projectId) {
        projectId = config.projectId;
      }
    } catch {
      // Continue with env vars
    }
  }

  if (!bucketName) {
    bucketName = 'calm-mote-r8chg.firebasestorage.app';
  }
  if (!projectId) {
    projectId = 'calm-mote-r8chg';
  }

  return { bucketName, projectId };
}

/**
 * Initializes Firebase Admin Storage bucket if configured.
 */
export function getStorageBucket(): any | null {
  try {
    const { bucketName, projectId } = getStorageBucketConfig();

    const apps = adminApp.getApps();
    const app = apps.length > 0 ? apps[0] : adminApp.initializeApp({
      projectId,
      storageBucket: bucketName
    });

    return adminStorage.getStorage(app).bucket(bucketName);
  } catch (err) {
    return null;
  }
}

// Cached bucket availability with 30s TTL to prevent repeated network timeouts
let cloudBucketChecked = false;
let cloudBucketExists = false;
let lastCheckTimestamp = 0;
const BUCKET_CHECK_CACHE_TTL_MS = 30000;

export function resetStorageBucketCache(): void {
  cloudBucketChecked = false;
  cloudBucketExists = false;
  lastCheckTimestamp = 0;
}

export async function checkCloudBucketAvailable(bucket: any): Promise<boolean> {
  const now = Date.now();
  if (cloudBucketChecked && (now - lastCheckTimestamp < BUCKET_CHECK_CACHE_TTL_MS)) {
    return cloudBucketExists;
  }
  try {
    const [exists] = await bucket.exists();
    cloudBucketExists = Boolean(exists);
  } catch {
    cloudBucketExists = false;
  }
  cloudBucketChecked = true;
  lastCheckTimestamp = now;
  return cloudBucketExists;
}

/**
 * Diagnostic status check for Cloud Storage.
 */
export async function checkStorageStatus(): Promise<{
  available: boolean;
  bucketName: string;
  projectId: string;
  error?: string;
}> {
  const { bucketName, projectId } = getStorageBucketConfig();
  const bucket = getStorageBucket();
  if (!bucket) {
    return {
      available: false,
      bucketName,
      projectId,
      error: 'Firebase Admin Storage could not be initialized.'
    };
  }

  const isAvailable = await checkCloudBucketAvailable(bucket);
  if (!isAvailable) {
    return {
      available: false,
      bucketName,
      projectId,
      error: `Storage bucket '${bucketName}' does not exist or is not accessible with current credentials.`
    };
  }

  return {
    available: true,
    bucketName,
    projectId
  };
}

/**
 * Uploads an authenticated image strictly to permanent Cloud Storage.
 *
 * NOTE (P1 Permanent Media Storage):
 * Local filesystem fallback (/uploads/portfolio/) has been permanently removed.
 * If Cloud Storage is unavailable or unprovisioned, this function throws an error
 * to prevent misleading the administrator and losing media across Cloud Run restarts.
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

  const ext = validation.detectedExt;
  const mime = validation.detectedMime;
  const uniqueToken = crypto.randomBytes(8).toString('hex');
  const safeFilename = `portfolio-${Date.now()}-${uniqueToken}.${ext}`;
  const objectPath = `portfolio/${safeFilename}`;

  // 1. Verify Cloud Storage bucket is available
  const bucket = getStorageBucket();
  const { bucketName, projectId } = getStorageBucketConfig();

  if (!bucket) {
    throw new Error(
      `Cloud media storage configuration is missing. Ephemeral local storage has been disabled to prevent media loss. Please ensure Firebase/Google Cloud Storage is provisioned for project '${projectId}'.`
    );
  }

  const isAvailable = await checkCloudBucketAvailable(bucket);
  if (!isAvailable) {
    throw new Error(
      `Cloud media storage unavailable: bucket '${bucketName}' does not exist or is not accessible from Cloud Run. Ephemeral local storage has been disabled to prevent data loss. Please ensure the Cloud Storage bucket is created in Google Cloud project '${projectId}'.`
    );
  }

  // 2. Upload file to Cloud Storage with metadata and download token
  const downloadToken = crypto.randomUUID();
  const fileRef = bucket.file(objectPath);

  try {
    await fileRef.save(buffer, {
      metadata: {
        contentType: mime,
        cacheControl: 'public, max-age=31536000',
        metadata: {
          firebaseStorageDownloadTokens: downloadToken
        }
      }
    });
  } catch (err: any) {
    cloudBucketExists = false;
    throw new Error(`Failed to upload image to Cloud Storage: ${err.message || 'Storage write error'}`);
  }

  // 3. Verify successful object creation
  try {
    const [exists] = await fileRef.exists();
    if (!exists) {
      throw new Error(`Upload verification failed: object '${objectPath}' was not found in bucket '${bucketName}' after save.`);
    }
  } catch (err: any) {
    throw new Error(`Verification of uploaded object failed: ${err.message || 'Object existence check failed'}`);
  }

  // 4. Construct persistent public URL
  let persistentUrl: string;
  try {
    await fileRef.makePublic();
    persistentUrl = `https://storage.googleapis.com/${bucket.name}/${objectPath}`;
  } catch {
    // If uniform bucket-level access prevents makePublic(), use standard Firebase Storage download URL
    const encodedPath = encodeURIComponent(objectPath);
    persistentUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${downloadToken}`;
  }

  return {
    url: persistentUrl,
    filename: safeFilename,
    size: buffer.length,
    mimeType: mime,
    storageProvider: 'firebase_storage',
    browserNotice: validation.browserNotice
  };
}

/**
 * Safely deletes an image from Cloud Storage if it belongs to our configured bucket.
 * Ignores external URLs (e.g. Unsplash) and fails gracefully without throwing.
 */
export async function deleteStorageImage(imageUrl?: string | null): Promise<boolean> {
  if (!imageUrl || typeof imageUrl !== 'string') return false;

  // External URLs (like Unsplash, etc.) are not managed by our Cloud Storage
  if (
    imageUrl.startsWith('https://images.unsplash.com/') ||
    (imageUrl.startsWith('http://') && !imageUrl.includes('storage.googleapis.com'))
  ) {
    return false;
  }

  const bucket = getStorageBucket();
  if (!bucket) return false;

  try {
    let objectPath: string | null = null;

    if (imageUrl.includes(`storage.googleapis.com/${bucket.name}/`)) {
      const parts = imageUrl.split(`storage.googleapis.com/${bucket.name}/`);
      if (parts[1]) {
        objectPath = decodeURIComponent(parts[1].split('?')[0]);
      }
    } else if (imageUrl.includes(`firebasestorage.googleapis.com/v0/b/${bucket.name}/o/`)) {
      const parts = imageUrl.split(`firebasestorage.googleapis.com/v0/b/${bucket.name}/o/`);
      if (parts[1]) {
        objectPath = decodeURIComponent(parts[1].split('?')[0]);
      }
    }

    if (!objectPath || !objectPath.startsWith('portfolio/')) {
      return false;
    }

    const fileRef = bucket.file(objectPath);
    const [exists] = await fileRef.exists();
    if (exists) {
      await fileRef.delete();
      console.log(`[Storage] Deleted Cloud Storage object: ${objectPath}`);
      return true;
    }
  } catch (err: any) {
    console.warn(`[Storage] Non-fatal cleanup notice for '${imageUrl}':`, err.message);
  }

  return false;
}
