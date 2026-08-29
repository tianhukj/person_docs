import { supabaseAdmin, json, errorResponse, handleOptions, type ApiPersonRecord } from '../lib/supabaseAdmin.js';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request) {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('person_records')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return errorResponse(error.message, 500);
    return json(data as ApiPersonRecord[]);
  }

  if (req.method === 'POST') {
    const body = await req.json().catch(() => null);
    if (!body) return errorResponse('Invalid JSON body', 400);
    const { data, error } = await supabaseAdmin.from('person_records').insert(body).select().single();
    if (error) return errorResponse(error.message, 400);
    return json(data as ApiPersonRecord, 201);
  }

  return errorResponse('Method not allowed', 405);
}
