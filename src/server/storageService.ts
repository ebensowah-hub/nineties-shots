import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import * as adminApp from 'firebase-admin/app';
import * as adminStorage from 'firebase-admin/storage';

export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
]);

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  storageProvider: 'firebase_storage' | 'local_fallback';
}

interface ValidationResult {
  valid: boolean;
  error?: string;
  detectedExt?: 'jpg' | 'png' | 'webp';
  detectedMime?: string;
}

/**
 * Inspects binary magic numbers to prevent disguised or arbitrary file uploads.
 */
export function validateImageBuffer(buffer: Buffer, claimedMime?: string): ValidationResult {
  if (!buffer || buffer.length === 0) {
    return { valid: false, error: 'Uploaded file is empty.' };
  }

  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: 'File size exceeds the maximum limit of 15MB.' };
  }

  if (claimedMime && !ALLOWED_MIME_TYPES.has(claimedMime.toLowerCase())) {
    return { valid: false, error: 'Invalid file MIME type. Only JPG, PNG, and WebP images are permitted.' };
  }

  if (buffer.length < 12) {
    return { valid: false, error: 'File is too small to be a valid image.' };
  }

  // Magic byte checks:
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a;
  const isWebp =
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP';

  if (!isJpeg && !isPng && !isWebp) {
    return {
      valid: false,
      error: 'File contents do not match supported image formats (JPEG, PNG, WebP). Arbitrary file uploads are rejected.'
    };
  }

  const detectedExt = isJpeg ? 'jpg' : isPng ? 'png' : 'webp';
  const detectedMime = isJpeg ? 'image/jpeg' : isPng ? 'image/png' : 'image/webp';

  return { valid: true, detectedExt, detectedMime };
}

/**
 * Initializes Firebase Admin Storage bucket if configured.
 */
function getStorageBucket(): any | null {
  try {
    let bucketName = process.env.FIREBASE_STORAGE_BUCKET || process.env.STORAGE_BUCKET || process.env.GCS_BUCKET;
    let projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCP_PROJECT;

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

    if (!bucketName && !projectId) {
      return null;
    }

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

// Cache cloud bucket availability to prevent repeated 404 network timeouts and error logs
let cloudBucketChecked = false;
let cloudBucketExists = false;

async function checkCloudBucketAvailable(bucket: any): Promise<boolean> {
  if (cloudBucketChecked) return cloudBucketExists;
  try {
    const [exists] = await bucket.exists();
    cloudBucketExists = Boolean(exists);
  } catch {
    cloudBucketExists = false;
  }
  cloudBucketChecked = true;
  return cloudBucketExists;
}

/**
 * Uploads an authenticated image to Cloud Storage with local static fallback.
 * Ensures the binary is never stored inside Firestore documents.
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

  // 1. Attempt Cloud Storage upload ONLY if bucket is verified to exist and be accessible
  const bucket = getStorageBucket();
  if (bucket && (await checkCloudBucketAvailable(bucket))) {
    try {
      const fileRef = bucket.file(`portfolio/${safeFilename}`);
      await fileRef.save(buffer, {
        metadata: {
          contentType: mime,
          cacheControl: 'public, max-age=31536000'
        }
      });

      // Try making the file public or generating a direct download URL
      try {
        await fileRef.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/portfolio/${safeFilename}`;
        return {
          url: publicUrl,
          filename: safeFilename,
          size: buffer.length,
          mimeType: mime,
          storageProvider: 'firebase_storage'
        };
      } catch {
        // If uniform bucket-level access prevents makePublic, use download URL with media link
        const encodedPath = encodeURIComponent(`portfolio/${safeFilename}`);
        const firebaseUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media`;
        return {
          url: firebaseUrl,
          filename: safeFilename,
          size: buffer.length,
          mimeType: mime,
          storageProvider: 'firebase_storage'
        };
      }
    } catch {
      cloudBucketExists = false;
    }
  }

  // 2. Safe local static uploads directory (ensures upload functions seamlessly across all environments)
  const uploadsDir = path.join(process.cwd(), 'uploads', 'portfolio');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const destinationPath = path.join(uploadsDir, safeFilename);
  fs.writeFileSync(destinationPath, buffer);

  const localUrl = `/uploads/portfolio/${safeFilename}`;

  return {
    url: localUrl,
    filename: safeFilename,
    size: buffer.length,
    mimeType: mime,
    storageProvider: 'local_fallback'
  };
}
