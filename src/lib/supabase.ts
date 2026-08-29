export const STORAGE_BUCKET = 'person-documents';

/** Resolve a relative storage path stored in the DB to a viewable image URL.
 *  The bucket is private, so we proxy through the /api/image route which
 *  generates a short-lived signed URL on the server. */
export function publicUrlFor(relativePath: string | null | undefined): string {
  if (!relativePath) return '';
  if (/^https?:\/\//i.test(relativePath)) return relativePath;
  return `/api/image?path=${encodeURIComponent(relativePath)}`;
}

// ---- Types ----

export interface PersonRecord {
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

export interface VerifyTask {
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

export interface VerifyTaskWithPerson extends VerifyTask {
  person_records?: Pick<PersonRecord, 'id' | 'full_name' | 'document_no'>;
}

export type TaskCounts = Record<string, { total: number; status: string }>;

// ---- API helpers ----

const API_BASE = '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    let msg = `请求失败 (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) msg = body.error;
    } catch {
      /* ignore parse errors */
    }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

// ---- Person records ----

export const personsApi = {
  list: () => request<PersonRecord[]>('/persons'),
  create: (payload: Omit<PersonRecord, 'id' | 'created_at'>) =>
    request<PersonRecord>('/persons', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: string, payload: Partial<Omit<PersonRecord, 'id' | 'created_at'>>) =>
    request<PersonRecord>(`/persons/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  remove: (id: string) => request<{ success: boolean }>(`/persons/${id}`, { method: 'DELETE' }),
};

// ---- Verify tasks ----

export const tasksApi = {
  list: () => request<VerifyTaskWithPerson[]>('/tasks'),
  create: (payload: Omit<VerifyTask, 'id' | 'created_at'>) =>
    request<VerifyTask>('/tasks', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: string, payload: Partial<Omit<VerifyTask, 'id' | 'created_at'>>) =>
    request<VerifyTask>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  remove: (id: string) => request<{ success: boolean }>(`/tasks/${id}`, { method: 'DELETE' }),
  counts: (personIds: string[]) => {
    if (personIds.length === 0) return Promise.resolve<TaskCounts>({});
    const qs = personIds.join(',');
    return request<TaskCounts>(`/tasks/counts?person_ids=${encodeURIComponent(qs)}`);
  },
};
