import { useRef, useState } from 'react';
import { Upload, Loader as Loader2, Image as ImageIcon } from 'lucide-react';
import { useImageUpload } from '@/lib/useImageUpload';
import { publicUrlFor } from '@/lib/supabase';

interface ImageUploadFieldProps {
  label: string;
  folder: string;
  value: string | null; // relative path stored in DB
  onChange: (relativePath: string | null) => void;
}

export default function ImageUploadField({ label, folder, value, onChange }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, uploading, error } = useImageUpload();
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);

  const displayPath = uploadedPath ?? value;
  const url = publicUrlFor(displayPath);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const result = await upload(file, folder);
    if (result) {
      onChange(result.path);
      setUploadedPath(result.path);
    }
  };

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-emerald-900">{label}</label>
      <div
        onClick={() => inputRef.current?.click()}
        className="group relative flex h-40 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50/40 transition hover:border-emerald-400 hover:bg-emerald-50/70"
      >
        {url ? (
          <>
            <img src={url} alt={label} className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-emerald-900/40 opacity-0 transition group-hover:opacity-100">
              <span className="flex items-center gap-2 text-sm font-medium text-white">
                <Upload className="h-4 w-4" /> 重新上传
              </span>
            </div>
          </>
        ) : uploading ? (
          <div className="flex flex-col items-center gap-2 text-emerald-500">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-sm">上传中…</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-emerald-400">
            {error ? (
              <span className="text-sm text-red-500">{error}</span>
            ) : (
              <>
                <ImageIcon className="h-7 w-7" />
                <span className="text-sm">点击上传图片</span>
              </>
            )}
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
