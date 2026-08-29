import { useEffect, useState, type FormEvent } from 'react';
import { tasksApi, type PersonRecord, type VerifyTask } from '@/lib/supabase';
import Modal from '@/components/Modal';
import ImageUploadField from '@/components/ImageUploadField';
import { Save, Loader as Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  editing: VerifyTask | null;
  persons: PersonRecord[];
  saved: () => void;
}

const statusOptions: VerifyTask['status'][] = ['待核验', '通过', '未通过'];

export default function VerifyTaskFormModal({ open, onClose, editing, persons, saved }: Props) {
  const [form, setForm] = useState({
    person_id: '',
    session_id: '',
    session_kycid: '',
    session_url: '',
    status: '待核验' as VerifyTask['status'],
    image_url: '' as string | null,
    finished_at: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setError('');
      if (editing) {
        setForm({
          person_id: editing.person_id,
          session_id: editing.session_id,
          session_kycid: editing.session_kycid,
          session_url: editing.session_url,
          status: editing.status,
          image_url: editing.image_url,
          finished_at: editing.finished_at ? editing.finished_at.slice(0, 16) : '',
        });
      } else {
        setForm({
          person_id: persons[0]?.id ?? '',
          session_id: '',
          session_kycid: '',
          session_url: '',
          status: '待核验',
          image_url: null,
          finished_at: '',
        });
      }
    }
  }, [open, editing, persons]);

  const set = (k: keyof typeof form, v: string | null) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.person_id || !form.session_id || !form.session_kycid || !form.session_url || !form.status) {
      setError('请填写所有必填项');
      return;
    }
    setSaving(true);
    try {
      const finishedAt = form.finished_at ? new Date(form.finished_at).toISOString() : null;
      const payload = {
        person_id: form.person_id,
        session_id: form.session_id,
        session_kycid: form.session_kycid,
        session_url: form.session_url,
        status: form.status,
        image_url: form.image_url || null,
        finished_at: form.status === '待核验' ? null : finishedAt,
      };
      if (editing) {
        await tasksApi.update(editing.id, payload);
      } else {
        await tasksApi.create(payload);
      }
      saved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    'w-full rounded-lg border border-emerald-200 bg-emerald-50/30 px-3 py-2 text-emerald-900 placeholder-emerald-400/60 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100';
  const labelCls = 'mb-1 block text-sm font-medium text-emerald-800';

  return (
    <Modal open={open} onClose={onClose} title={editing ? '编辑核验任务' : '新增核验任务'} size="xl">
      {persons.length === 0 ? (
        <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
          请先创建至少一条人员档案，再添加核验任务。
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelCls}>关联人员档案 *</label>
              <select className={inputCls} value={form.person_id} onChange={(e) => set('person_id', e.target.value)}>
                {persons.map((p) => (
                  <option key={p.id} value={p.id}>{p.full_name} · {p.document_no}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>IDAnalyzer 会话 ID *</label>
              <input className={inputCls} value={form.session_id} onChange={(e) => set('session_id', e.target.value)} placeholder="session id" />
            </div>
            <div>
              <label className={labelCls}>KYC 配置文件 ID *</label>
              <input className={inputCls} value={form.session_kycid} onChange={(e) => set('session_kycid', e.target.value)} placeholder="kyc id" />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>核验网页链接 *</label>
              <input className={inputCls} value={form.session_url} onChange={(e) => set('session_url', e.target.value)} placeholder="https://…" />
            </div>
            <div>
              <label className={labelCls}>核验状态 *</label>
              <select className={inputCls} value={form.status} onChange={(e) => set('status', e.target.value as VerifyTask['status'])}>
                {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>核验完成时间</label>
              <input
                type="datetime-local"
                className={inputCls}
                value={form.finished_at}
                onChange={(e) => set('finished_at', e.target.value)}
                disabled={form.status === '待核验'}
              />
            </div>
            <div className="sm:col-span-2">
              <ImageUploadField
                label="拍摄的人脸照片"
                folder="verify"
                value={form.image_url}
                onChange={(p) => set('image_url', p)}
              />
            </div>
          </div>

          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

          <div className="flex justify-end gap-3 border-t border-emerald-100 pt-4">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50">取消</button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-300/40 transition hover:from-emerald-600 hover:to-teal-600 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              保存
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
