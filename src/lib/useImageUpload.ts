import { useCallback, useState } from 'react';

interface UploadResult {
  path: string;
}

/**
 * Uploads an image file through the /api/upload route and returns the
 * relative path (stored in the DB).
 */
export function useImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (file: File, folder: string): Promise<UploadResult | null> => {
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        let msg = '上传失败';
        try {
          const body = await res.json();
          if (body?.error) msg = body.error;
        } catch {
          /* ignore */
        }
        throw new Error(msg);
      }
      const data = (await res.json()) as UploadResult;
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : '上传失败';
      setError(msg);
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  const remove = useCallback(async (relativePath: string | null | undefined) => {
    if (!relativePath) return;
    try {
      await fetch('/api/image', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: relativePath }),
      });
    } catch {
      /* ignore */
    }
  }, []);

  return { upload, remove, uploading, error };
}
