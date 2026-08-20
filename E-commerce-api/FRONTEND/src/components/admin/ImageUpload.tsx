import React, { useState, useCallback } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { apiClient } from '../../lib/api-client';

type ImageUploadProps = {
  label: string;
  currentImageUrl?: string;
  onImageUploaded: (url: string) => void;
  onImageRemoved?: () => void;
  accept?: string;
  maxSizeMB?: number;
};

export const ImageUpload: React.FC<ImageUploadProps> = ({
  label,
  currentImageUrl,
  onImageUploaded,
  onImageRemoved,
  accept = 'image/png, image/jpeg, image/jpg, image/gif, image/webp, image/svg+xml',
  maxSizeMB = 5,
}) => {
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    setUploading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);
      const res = await apiClient.post<{ url: string }>('/upload/image', buffer, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'X-Filename': file.name,
        },
      });
      const uploadedUrl = res.data.url;
      onImageUploaded(uploadedUrl);
      setPreview(uploadedUrl);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Upload failed';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
      setPreview(currentImageUrl || null);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }, [currentImageUrl, onImageUploaded]);

  const handleRemove = useCallback(() => {
    setPreview(null);
    onImageRemoved?.();
  }, [onImageRemoved]);

  const displayUrl = preview || currentImageUrl;

  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{label}</label>
      <div className="flex items-start gap-4">
        <div className="w-32 h-32 bg-zinc-900 border border-zinc-700 rounded-xs flex items-center justify-center overflow-hidden shrink-0">
          {displayUrl ? (
            <img src={displayUrl} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <span className="text-zinc-600 text-[10px] text-center px-2">No image</span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="btn-accent text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 px-3 py-2">
            <Upload className="w-3.5 h-3.5" />
            {uploading ? 'Uploading...' : 'Choose Image'}
            <input
              type="file"
              accept={accept}
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
            />
          </label>
          {displayUrl && (
            <button type="button" onClick={handleRemove} className="text-xs text-zinc-400 hover:text-rose-600 flex items-center gap-1">
              <X className="w-3.5 h-3.5" /> Remove
            </button>
          )}
          <p className="text-[10px] text-zinc-500">Max {maxSizeMB}MB. JPG, PNG, WebP, SVG.</p>
        </div>
      </div>
      {uploading && (
        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...
        </div>
      )}
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
};
