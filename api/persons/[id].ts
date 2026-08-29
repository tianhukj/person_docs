import { supabaseAdmin, json, errorResponse, handleOptions, type ApiPersonRecord } from '../lib/supabaseAdmin';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request) {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  const url = new URL(req.url);
  const id = url.pathname.split('/').pop() as string;

  if (req.method === 'PUT') {
    const body = await req.json().catch(() => null);
    if (!body) return errorResponse('Invalid JSON body', 400);
    const { data, error } = await supabaseAdmin
      .from('person_records')
      .update(body)
      .eq('id', id)
      .select()
      .single();
    if (error) return errorResponse(error.message, 400);
    return json(data as ApiPersonRecord);
  }

  if (req.method === 'DELETE') {
    const { error } = await supabaseAdmin.from('person_records').delete().eq('id', id);
    if (error) return errorResponse(error.message, 500);
    return json({ success: true });
  }

  return errorResponse('Method not allowed', 405);
}
