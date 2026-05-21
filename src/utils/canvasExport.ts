import { SliderSettings } from '../types';

export function buildCanvasFilter(settings: SliderSettings): string {
  const satValue = 100 + (settings.colorVibrancy - 50) * 1.4;
  const briValue = 95 + (settings.brightness - 50) * 1.1;
  const conValue = 100 + (settings.contrast - 50) * 1.3;
  const finalContrast = conValue + (settings.facialClarity - 50) * 0.45;
  const parts = [
    `saturate(${satValue}%)`,
    `brightness(${briValue}%)`,
    `contrast(${finalContrast}%)`,
  ];
  if (settings.denoise > 80) {
    parts.push('blur(0.25px)');
  }
  return parts.join(' ');
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image for export.'));
    img.src = src;
  });
}

function applyRimLight(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  rimLight: number
) {
  if (rimLight <= 0) return;

  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.max(width, height) * 0.72;
  const gradient = ctx.createRadialGradient(cx, cy, radius * 0.38, cx, cy, radius);
  gradient.addColorStop(0, 'rgba(245, 158, 11, 0)');
  gradient.addColorStop(0.72, 'rgba(245, 158, 11, 0.22)');
  gradient.addColorStop(1, 'rgba(245, 158, 11, 0.46)');

  ctx.save();
  ctx.globalAlpha = (rimLight / 100) * 0.42;
  ctx.globalCompositeOperation = 'color-dodge';
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function applyShadowTint(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  shadowTint: number
) {
  const gradient = ctx.createLinearGradient(0, height * 0.5, 0, height);

  if (shadowTint < 50) {
    const intensity = ((50 - shadowTint) / 50) * 0.35;
    gradient.addColorStop(0, `rgba(30, 58, 138, ${intensity})`);
    gradient.addColorStop(0.75, 'rgba(15, 23, 42, 0.05)');
    gradient.addColorStop(1, 'rgba(15, 23, 42, 0)');
  } else {
    const intensity = ((shadowTint - 50) / 50) * 0.28;
    gradient.addColorStop(0, `rgba(120, 53, 4, ${intensity})`);
    gradient.addColorStop(0.6, `rgba(120, 53, 4, ${intensity * 0.1})`);
    gradient.addColorStop(1, 'rgba(120, 53, 4, 0)');
  }

  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = gradient;
  ctx.fillRect(0, height * 0.5, width, height * 0.5);
  ctx.restore();
}

function applyFilmicGlow(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number,
  filmicGlow: number
) {
  if (filmicGlow <= 0) return;

  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = width;
  glowCanvas.height = height;
  const glowCtx = glowCanvas.getContext('2d');
  if (!glowCtx) return;

  glowCtx.filter = 'blur(16px) brightness(1.3) contrast(1.25)';
  glowCtx.drawImage(img, 0, 0, width, height);

  ctx.save();
  ctx.globalAlpha = (filmicGlow / 100) * 0.35;
  ctx.globalCompositeOperation = 'screen';
  ctx.drawImage(glowCanvas, 0, 0);
  ctx.restore();
}

export interface BakeExportOptions {
  /** When true, slider filters and overlay effects are baked in (preview mode). */
  applySliderEffects: boolean;
}

/**
 * Draws the image onto a hidden canvas, optionally bakes slider adjustments,
 * and returns a PNG data URL for download.
 */
export async function bakeImageForDownload(
  imageSrc: string,
  settings: SliderSettings,
  options: BakeExportOptions
): Promise<string> {
  const img = await loadImage(imageSrc);
  const width = img.naturalWidth;
  const height = img.naturalHeight;

  if (width === 0 || height === 0) {
    throw new Error('Image has no drawable dimensions.');
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas is not available in this browser.');
  }

  if (options.applySliderEffects) {
    ctx.filter = buildCanvasFilter(settings);
  }

  ctx.drawImage(img, 0, 0, width, height);
  ctx.filter = 'none';

  if (options.applySliderEffects) {
    applyRimLight(ctx, width, height, settings.rimLight);
    applyShadowTint(ctx, width, height, settings.shadowTint);
    applyFilmicGlow(ctx, img, width, height, settings.filmicGlow);
  }

  return canvas.toDataURL('image/png');
}

export function triggerDownloadFromDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
