import { supabaseAdmin, STORAGE_BUCKET, json, errorResponse, handleOptions } from './lib/supabaseAdmin.js';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request) {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  if (req.method !== 'POST') return errorResponse('Method not allowed', 405);

  const formData = await req.formData().catch(() => null);
  if (!formData) return errorResponse('Expected multipart/form-data', 400);

  const file = formData.get('file') as File | null;
  const folder = (formData.get('folder') as string | null) || 'misc';
  if (!file) return errorResponse('Missing "file" field', 400);

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, arrayBuffer, {
      contentType: file.type || 'image/jpeg',
      cacheControl: '3600',
      upsert: false,
    });

  if (error) return errorResponse(error.message, 500);

  return json({ path: fileName }, 201);
}
