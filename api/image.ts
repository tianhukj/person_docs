import { supabaseAdmin, STORAGE_BUCKET, errorResponse, handleOptions } from './lib/supabaseAdmin.js';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request) {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  const url = new URL(req.url);
  const path = url.searchParams.get('path');

  if (req.method === 'GET') {
    if (!path) return errorResponse('Missing "path" query param', 400);
    const { data, error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(path, 3600);
    if (error || !data?.signedUrl) return errorResponse(error?.message ?? 'Failed to create signed URL', 500);
    return Response.redirect(data.signedUrl, 302);
  }

  if (req.method === 'DELETE') {
    const body = (await req.json().catch(() => null)) as { path?: string } | null;
    if (!body || !body.path) return errorResponse('Missing "path" in body', 400);
    const { error } = await supabaseAdmin.storage.from(STORAGE_BUCKET).remove([body.path]);
    if (error) return errorResponse(error.message, 500);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  return errorResponse('Method not allowed', 405);
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}
