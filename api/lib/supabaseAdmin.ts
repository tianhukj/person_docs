import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    'Missing server Supabase env vars. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel project settings.'
  );
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false },
});

export const STORAGE_BUCKET = 'person-documents';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export function json(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders, ...extraHeaders },
  });
}

export function errorResponse(message: string, status = 400) {
  return json({ error: message }, status);
}

export function handleOptions(req: Request) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  return null;
}

export interface ApiPersonRecord {
  id: string;
  mrz_text: string | null;
  full_name: string;
  name_en: string | null;
  document_no: string;
  date_of_birth: string;
  sex: string;
  country: string;
  issue_org: string;
  issue_date: string;
  document_face_img_url: string;
  created_at?: string;
}

export interface ApiVerifyTask {
  id: string;
  person_id: string;
  session_id: string;
  session_kycid: string;
  session_url: string;
  status: '待核验' | '通过' | '未通过';
  image_url: string | null;
  created_at?: string;
  finished_at: string | null;
}

export interface ApiVerifyTaskWithPerson extends ApiVerifyTask {
  person_records?: Pick<ApiPersonRecord, 'id' | 'full_name' | 'document_no'>;
}
