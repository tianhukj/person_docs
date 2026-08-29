import { useEffect, useState, type FormEvent } from 'react';
import { personsApi, type PersonRecord } from '@/lib/supabase';
import { useImageUpload } from '@/lib/useImageUpload';
import Modal from '@/components/Modal';
import ImageUploadField from '@/components/ImageUploadField';
import { Save, Loader as Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  editing: PersonRecord | null;
  saved: () => void;
}

const empty = {
  mrz_text: '',
  full_name: '',
  name_en: '',
  document_no: '',
  date_of_birth: '',
  sex: '男',
  country: '中国',
  issue_org: '',
  issue_date: '',
  document_face_img_url: '' as string | null,
};

export default function PersonFormModal({ open, onClose, editing, saved }: Props) {
  const [form, setForm] = useState({ ...empty });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { remove } = useImageUpload();

  useEffect(() => {
    if (open) {
      setError('');
      if (editing) {
        setForm({
          mrz_text: editing.mrz_text ?? '',
          full_name: editing.full_name,
          name_en: editing.name_en ?? '',
          document_no: editing.document_no,
          date_of_birth: editing.date_of_birth,
          sex: editing.sex,
          country: editing.country,
          issue_org: editing.issue_org,
          issue_date: editing.issue_date,
          document_face_img_url: editing.document_face_img_url,
        });
      } else {
        setForm({ ...empty });
      }
    }
  }, [open, editing]);

  const set = (k: keyof typeof form, v: string | null) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.full_name || !form.document_no || !form.date_of_birth || !form.sex || !form.country || !form.issue_org || !form.issue_date || !form.document_face_img_url) {
      setError('请填写所有必填项并上传证件照');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        mrz_text: form.mrz_text || null,
        full_name: form.full_name,
        name_en: form.name_en || null,
        document_no: form.document_no,
        date_of_birth: form.date_of_birth,
        sex: form.sex,
        country: form.country,
        issue_org: form.issue_org,
        issue_date: form.issue_date,
        document_face_img_url: form.document_face_img_url,
      };
      if (editing) {
        if (editing.document_face_img_url && editing.document_face_img_url !== form.document_face_img_url) {
          await remove(editing.document_face_img_url);
        }
        await personsApi.update(editing.id, payload);
      } else {
        await personsApi.create(payload);
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
    <Modal open={open} onClose={onClose} title={editing ? '编辑人员档案' : '新增人员档案'} size="xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <ImageUploadField
              label="证件照 *"
              folder="face"
              value={form.document_face_img_url}
              onChange={(p) => set('document_face_img_url', p)}
            />
          </div>

          <div>
            <label className={labelCls}>姓名 *</label>
            <input className={inputCls} value={form.full_name} onChange={(e) => set('full_name', e.target.value)} placeholder="姓名" />
          </div>
          <div>
            <label className={labelCls}>英文姓名</label>
            <input className={inputCls} value={form.name_en} onChange={(e) => set('name_en', e.target.value)} placeholder="English Name" />
          </div>
          <div>
            <label className={labelCls}>证件编号 *</label>
            <input className={inputCls} value={form.document_no} onChange={(e) => set('document_no', e.target.value)} placeholder="证件编号" />
          </div>
          <div>
            <label className={labelCls}>出生日期 *</label>
            <input type="date" className={inputCls} value={form.date_of_birth} onChange={(e) => set('date_of_birth', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>性别 *</label>
            <select className={inputCls} value={form.sex} onChange={(e) => set('sex', e.target.value)}>
              <option value="男">男</option>
              <option value="女">女</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>国籍 *</label>
            <input className={inputCls} value={form.country} onChange={(e) => set('country', e.target.value)} placeholder="国籍" />
          </div>
          <div>
            <label className={labelCls}>发证机关 *</label>
            <input className={inputCls} value={form.issue_org} onChange={(e) => set('issue_org', e.target.value)} placeholder="发证机关" />
          </div>
          <div>
            <label className={labelCls}>发证日期 *</label>
            <input type="date" className={inputCls} value={form.issue_date} onChange={(e) => set('issue_date', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>机读码 MRZ</label>
            <textarea
              className={`${inputCls} h-20 resize-none`}
              value={form.mrz_text}
              onChange={(e) => set('mrz_text', e.target.value)}
              placeholder="证件机读码（可选）"
            />
          </div>
        </div>

        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

        <div className="flex justify-end gap-3 border-t border-emerald-100 pt-4">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50">
            取消
          </button>
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
    </Modal>
  );
}
