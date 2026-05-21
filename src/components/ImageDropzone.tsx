import React, { useState, useRef } from 'react';
import { UploadCloud, AlertCircle, Sparkles } from 'lucide-react';
import { ACCEPT_IMAGE_ATTR, validateImageFile } from '../utils/imageValidation';

interface ImageDropzoneProps {
  onImageLoaded: (base64Data: string, mimeType: string) => void;
  onLoadDemo: () => void;
  isProcessing: boolean;
}

const MAX_FILE_BYTES = 8 * 1024 * 1024;

export default function ImageDropzone({
  onImageLoaded,
  onLoadDemo,
  isProcessing,
}: ImageDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const rejectFile = (message: string) => {
    setError(message);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processFile = (file: File) => {
    const validation = validateImageFile(file);
    if (validation.valid === false) {
      rejectFile(validation.message);
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      rejectFile('Image is too large. Maximum file size is 8MB.');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onImageLoaded(reader.result, file.type || 'image/jpeg');
      }
    };
    reader.onerror = () => {
      rejectFile('Failed to read image. Please try another file.');
    };
    reader.readAsDataURL(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    setIsDragActive(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    if (isProcessing) return;

    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const triggerInputClick = () => {
    if (isProcessing) return;
    fileInputRef.current?.click();
  };

  return (
    <div id="dropzone-container" className="space-y-4">
      <div
        id="dropzone-area"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={triggerInputClick}
        className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-3xl p-8 text-center transition-all duration-300 cursor-pointer min-h-[300px] select-none ${
          isDragActive
            ? 'border-amber-500 bg-amber-500/5 scale-[0.99] shadow-inner shadow-amber-500/10'
            : 'border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900/50'
        } ${isProcessing ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          id="file-selector-input"
          accept={ACCEPT_IMAGE_ATTR}
          onChange={onFileChange}
          className="hidden"
          disabled={isProcessing}
        />

        <div className="p-4 rounded-full bg-zinc-900/80 border border-zinc-800/80 text-amber-500 shadow-xl group-hover:scale-115 transition-transform duration-300">
          <UploadCloud className="w-8 h-8 text-amber-500" />
        </div>

        <div className="mt-5 space-y-2">
          <h3 className="text-sm font-bold text-zinc-100 font-mono tracking-wide uppercase">
            Upload raw couple image
          </h3>
          <p className="text-xs text-zinc-450 max-w-sm leading-relaxed">
            Drag & drop your low-light couple photo or original camera image here, or{' '}
            <span className="text-amber-500 underline font-semibold">browse files</span>.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <span className="text-[10px] font-mono uppercase bg-zinc-950 px-2.5 py-1 rounded-md border border-zinc-850 text-zinc-550">
            JPG / PNG / WebP up to 8MB
          </span>
          <span className="text-[10px] font-mono uppercase bg-zinc-950 px-2.5 py-1 rounded-md border border-zinc-850 text-zinc-550">
            PDF &amp; PPT rejected
          </span>
        </div>

        {error && (
          <div
            id="dropzone-error"
            role="alert"
            className="absolute bottom-4 left-4 right-4 bg-red-950/90 border border-red-500/40 rounded-xl p-3 flex items-start gap-2 text-xs text-red-100 shadow-xl animate-fade-in"
          >
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="text-left leading-snug font-medium">{error}</span>
          </div>
        )}
      </div>

      <div id="dropzone-fallback-prompt" className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 shadow-xl">
        <div className="flex items-start gap-3 text-left">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-amber-500">No raw photo on your device?</h4>
            <p className="text-[11px] text-zinc-400 leading-normal mt-0.5 max-w-md">
              Load our custom low-light portrait preset. It simulates an original camera shot under street lights and lets you instantly test the cinematic enhancement tools.
            </p>
          </div>
        </div>
        <button
          type="button"
          id="btn-load-demo"
          disabled={isProcessing}
          onClick={(e) => {
            e.stopPropagation();
            onLoadDemo();
          }}
          className="w-full sm:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-30 disabled:pointer-events-none text-zinc-950 font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all duration-150 cursor-pointer shadow-lg shadow-amber-500/10 shrink-0"
        >
          Load Demo Portrait
        </button>
      </div>
    </div>
  );
}
