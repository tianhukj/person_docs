import { supabaseAdmin, json, errorResponse, handleOptions } from '../lib/supabaseAdmin.js';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request) {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  if (req.method !== 'GET') return errorResponse('Method not allowed', 405);

  const url = new URL(req.url);
  const personIdsParam = url.searchParams.get('person_ids');
  if (!personIdsParam) return json({});

  const personIds = personIdsParam.split(',').filter(Boolean);
  if (personIds.length === 0) return json({});

  const { data, error } = await supabaseAdmin
    .from('verify_tasks')
    .select('person_id, status')
    .in('person_id', personIds);

  if (error) return errorResponse(error.message, 500);

  const counts: Record<string, { total: number; status: string }> = {};
  for (const t of (data ?? []) as { person_id: string; status: string }[]) {
    if (!counts[t.person_id]) counts[t.person_id] = { total: 0, status: t.status };
    counts[t.person_id].total += 1;
    counts[t.person_id].status = t.status;
  }
  return json(counts);
}
