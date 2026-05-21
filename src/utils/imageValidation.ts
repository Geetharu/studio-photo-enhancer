const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const BLOCKED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
]);

const BLOCKED_EXTENSIONS = new Set([
  '.pdf',
  '.ppt',
  '.pptx',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.txt',
  '.gif',
  '.bmp',
  '.svg',
  '.heic',
  '.heif',
  '.tiff',
  '.tif',
]);

export const ACCEPT_IMAGE_ATTR =
  '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp';

export type FileValidationResult =
  | { valid: true }
  | { valid: false; message: string };

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf('.');
  return dot >= 0 ? filename.slice(dot).toLowerCase() : '';
}

export function validateImageFile(file: File): FileValidationResult {
  const ext = getExtension(file.name);

  if (BLOCKED_MIME_TYPES.has(file.type) || BLOCKED_EXTENSIONS.has(ext)) {
    const label = ext ? ext.replace('.', '').toUpperCase() : 'document';
    return {
      valid: false,
      message: `${label} files are not supported. Please upload a JPG, PNG, or WebP image only.`,
    };
  }

  if (!ALLOWED_MIME_TYPES.has(file.type) && !ALLOWED_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      message:
        'Invalid file type. Only JPG, PNG, and WebP images are accepted. PDF, PowerPoint, and other documents cannot be uploaded.',
    };
  }

  return { valid: true };
}
