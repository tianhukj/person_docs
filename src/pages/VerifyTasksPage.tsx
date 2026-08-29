import { useEffect, useMemo, useState } from 'react';
import { personsApi, tasksApi, publicUrlFor, type PersonRecord, type VerifyTaskWithPerson } from '@/lib/supabase';
import VerifyTaskFormModal from '@/components/VerifyTaskFormModal';
import { Plus, Search, Pencil, Trash2, Loader as Loader2, ClipboardCheck, ExternalLink, Image as ImageIcon } from 'lucide-react';

const statusStyles: Record<string, { badge: string; dot: string }> = {
  '待核验': { badge: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-400' },
  '通过': { badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  '未通过': { badge: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' },
};

export default function VerifyTasksPage() {
  const [tasks, setTasks] = useState<VerifyTaskWithPerson[]>([]);
  const [persons, setPersons] = useState<PersonRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<VerifyTaskWithPerson | null>(null);
  const [confirmDel, setConfirmDel] = useState<VerifyTaskWithPerson | null>(null);
  const load = async () => {
    setLoading(true);
    try {
      const [p, t] = await Promise.all([personsApi.list(), tasksApi.list()]);
      setPersons(p);
      setTasks(t);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => {
      if (filterStatus !== 'all' && t.status !== filterStatus) return false;
      if (!q) return true;
      const name = t.person_records?.full_name?.toLowerCase() ?? '';
      const doc = t.person_records?.document_no?.toLowerCase() ?? '';
      return name.includes(q) || doc.includes(q) || t.session_id.toLowerCase().includes(q);
    });
  }, [tasks, search, filterStatus]);

  const counts = useMemo(() => {
    const c = { all: tasks.length, '待核验': 0, '通过': 0, '未通过': 0 };
    for (const t of tasks) c[t.status] += 1;
    return c;
  }, [tasks]);

  const handleDelete = async () => {
    if (!confirmDel) return;
    await tasksApi.remove(confirmDel.id);
    setConfirmDel(null);
    load();
  };

  const openNew = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (t: VerifyTaskWithPerson) => { setEditing(t); setModalOpen(true); };

  const fmtDate = (s?: string | null) => {
    if (!s) return '—';
    const d = new Date(s);
    return d.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-emerald-900">
            <ClipboardCheck className="h-5 w-5 text-emerald-500" /> 核验任务
          </h1>
          <p className="mt-0.5 text-sm text-emerald-600/70">共 {tasks.length} 条任务</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索姓名 / 会话 ID"
              className="w-full rounded-lg border border-emerald-200 bg-white py-2 pl-9 pr-3 text-sm text-emerald-900 placeholder-emerald-400/70 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 sm:w-56"
            />
          </div>
          <button
            onClick={openNew}
            disabled={persons.length === 0}
            className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-300/40 transition hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> 新增
          </button>
        </div>
      </div>

      {/* status filter tabs */}
      <div className="mb-5 flex flex-wrap gap-2">
        {(['all', '待核验', '通过', '未通过'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              filterStatus === s
                ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-300'
                : 'border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            {s === 'all' ? '全部' : s}
            <span className={`ml-1.5 ${filterStatus === s ? 'text-emerald-100' : 'text-emerald-400'}`}>
              {counts[s]}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-emerald-400">
          <Loader2 className="h-7 w-7 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/30 py-20 text-center">
          <ClipboardCheck className="mb-3 h-12 w-12 text-emerald-300" />
          <p className="text-emerald-700">暂无核验任务</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-emerald-100 bg-emerald-50/50 text-emerald-700">
                <tr>
                  <th className="px-4 py-3 font-medium">人员</th>
                  <th className="px-4 py-3 font-medium">会话 ID</th>
                  <th className="px-4 py-3 font-medium">人脸照片</th>
                  <th className="px-4 py-3 font-medium">状态</th>
                  <th className="px-4 py-3 font-medium">创建时间</th>
                  <th className="px-4 py-3 font-medium">完成时间</th>
                  <th className="px-4 py-3 text-right font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50">
                {filtered.map((t) => {
                  const st = statusStyles[t.status];
                  return (
                    <tr key={t.id} className="transition hover:bg-emerald-50/40">
                      <td className="px-4 py-3">
                        <div className="font-medium text-emerald-900">{t.person_records?.full_name ?? '—'}</div>
                        <div className="text-xs text-emerald-500">{t.person_records?.document_no ?? ''}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-[160px] truncate font-mono text-xs text-emerald-700" title={t.session_id}>{t.session_id}</div>
                        <a
                          href={t.session_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-0.5 inline-flex items-center gap-1 text-xs text-emerald-500 hover:underline"
                        >
                          打开链接 <ExternalLink className="h-3 w-3" />
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        {t.image_url ? (
                          <img src={publicUrlFor(t.image_url)} alt="face" className="h-12 w-12 rounded-lg object-cover ring-1 ring-emerald-100" />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 text-emerald-300">
                            <ImageIcon className="h-5 w-5" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${st.badge}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-emerald-600/80">{fmtDate(t.created_at)}</td>
                      <td className="px-4 py-3 text-xs text-emerald-600/80">{fmtDate(t.finished_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openEdit(t)} className="rounded-md p-1.5 text-emerald-500 transition hover:bg-emerald-50 hover:text-emerald-700">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => setConfirmDel(t)} className="rounded-md p-1.5 text-red-400 transition hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <VerifyTaskFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editing}
        persons={persons}
        saved={load}
      />

      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-emerald-900">确认删除？</h3>
            <p className="mt-2 text-sm text-emerald-700/80">删除该核验任务，此操作无法恢复。</p>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setConfirmDel(null)} className="rounded-lg px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50">取消</button>
              <button onClick={handleDelete} className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600">删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
