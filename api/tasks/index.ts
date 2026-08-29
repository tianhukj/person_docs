import {
  supabaseAdmin,
  json,
  errorResponse,
  handleOptions,
  type ApiVerifyTaskWithPerson,
} from '../lib/supabaseAdmin.js';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request) {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('verify_tasks')
      .select('*, person_records(id, full_name, document_no)')
      .order('created_at', { ascending: false });
    if (error) return errorResponse(error.message, 500);
    return json(data as ApiVerifyTaskWithPerson[]);
  }

  if (req.method === 'POST') {
    const body = await req.json().catch(() => null);
    if (!body) return errorResponse('Invalid JSON body', 400);
    const { data, error } = await supabaseAdmin.from('verify_tasks').insert(body).select().single();
    if (error) return errorResponse(error.message, 400);
    return json(data, 201);
  }

  return errorResponse('Method not allowed', 405);
}
