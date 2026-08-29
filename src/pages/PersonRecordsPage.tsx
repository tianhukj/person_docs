import { useEffect, useMemo, useState } from 'react';
import { personsApi, tasksApi, publicUrlFor, type PersonRecord, type TaskCounts } from '@/lib/supabase';
import { useImageUpload } from '@/lib/useImageUpload';
import PersonFormModal from '@/components/PersonFormModal';
import { Plus, Search, Pencil, Trash2, Loader as Loader2, CircleUser as UserCircle2, Users, FileText } from 'lucide-react';

const statusColors: Record<string, string> = {
  '待核验': 'bg-amber-100 text-amber-700',
  '通过': 'bg-emerald-100 text-emerald-700',
  '未通过': 'bg-red-100 text-red-700',
};

export default function PersonRecordsPage({ onNavigate }: { onNavigate: (tab: 'persons' | 'tasks') => void }) {
  const [records, setRecords] = useState<PersonRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PersonRecord | null>(null);
  const [confirmDel, setConfirmDel] = useState<PersonRecord | null>(null);
  const [viewing, setViewing] = useState<PersonRecord | null>(null);
  const { remove } = useImageUpload();
  const [taskCounts, setTaskCounts] = useState<TaskCounts>({});

  const load = async () => {
    setLoading(true);
    try {
      const rows = await personsApi.list();
      setRecords(rows);
      if (rows.length) {
        const counts = await tasksApi.counts(rows.map((r) => r.id));
        setTaskCounts(counts);
      } else {
        setTaskCounts({});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) =>
      r.full_name.toLowerCase().includes(q) ||
      r.document_no.toLowerCase().includes(q) ||
      (r.name_en ?? '').toLowerCase().includes(q)
    );
  }, [records, search]);

  const handleDelete = async () => {
    if (!confirmDel) return;
    await remove(confirmDel.document_face_img_url);
    await personsApi.remove(confirmDel.id);
    setConfirmDel(null);
    load();
  };

  const openNew = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (r: PersonRecord) => { setEditing(r); setModalOpen(true); };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-emerald-900">
            <Users className="h-5 w-5 text-emerald-500" /> 人员档案
          </h1>
          <p className="mt-0.5 text-sm text-emerald-600/70">共 {records.length} 条记录</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索姓名 / 证件号"
              className="w-full rounded-lg border border-emerald-200 bg-white py-2 pl-9 pr-3 text-sm text-emerald-900 placeholder-emerald-400/70 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 sm:w-56"
            />
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-300/40 transition hover:from-emerald-600 hover:to-teal-600"
          >
            <Plus className="h-4 w-4" /> 新增
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-emerald-400">
          <Loader2 className="h-7 w-7 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/30 py-20 text-center">
          <UserCircle2 className="mb-3 h-12 w-12 text-emerald-300" />
          <p className="text-emerald-700">暂无人员档案</p>
          <button onClick={openNew} className="mt-4 text-sm font-medium text-emerald-600 hover:underline">
            点击新增第一条记录
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((r) => {
            const tc = taskCounts[r.id];
            return (
              <div
                key={r.id}
                className="group overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-200/40"
              >
                <div
                  className="relative h-44 cursor-pointer overflow-hidden bg-emerald-50"
                  onClick={() => setViewing(r)}
                >
                  <img
                    src={publicUrlFor(r.document_face_img_url)}
                    alt={r.full_name}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  {tc && (
                    <span
                      className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[tc.status] ?? 'bg-gray-100 text-gray-600'}`}
                    >
                      {tc.status}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="truncate font-semibold text-emerald-900">{r.full_name}</h3>
                    <span className="text-xs text-emerald-500">{r.sex}</span>
                  </div>
                  <p className="mt-1 truncate text-xs text-emerald-600/70">{r.name_en || '—'}</p>
                  <div className="mt-3 space-y-1 text-xs text-emerald-700/80">
                    <p className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-emerald-400" /> {r.document_no}</p>
                    <p className="text-emerald-600/60">{r.country} · {r.date_of_birth}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-emerald-50 pt-3">
                    <button
                      onClick={() => onNavigate('tasks')}
                      className="text-xs font-medium text-emerald-600 hover:underline"
                    >
                      核验任务 {tc ? `(${tc.total})` : '(0)'}
                    </button>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(r)} className="rounded-md p-1.5 text-emerald-500 transition hover:bg-emerald-50 hover:text-emerald-700">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => setConfirmDel(r)} className="rounded-md p-1.5 text-red-400 transition hover:bg-red-50 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <PersonFormModal open={modalOpen} onClose={() => setModalOpen(false)} editing={editing} saved={load} />

      {/* delete confirm */}
      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-emerald-900">确认删除？</h3>
            <p className="mt-2 text-sm text-emerald-700/80">
              删除「{confirmDel.full_name}」的档案将同时删除其所有核验任务，且无法恢复。
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setConfirmDel(null)} className="rounded-lg px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50">取消</button>
              <button onClick={handleDelete} className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600">删除</button>
            </div>
          </div>
        </div>
      )}

      {/* detail view */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/40 p-4 backdrop-blur-sm" onClick={() => setViewing(null)}>
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:flex-row" onClick={(e) => e.stopPropagation()}>
            <div className="sm:w-2/5 bg-emerald-50">
              <img src={publicUrlFor(viewing.document_face_img_url)} alt={viewing.full_name} className="h-full w-full object-cover" />
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-emerald-900">{viewing.full_name}</h3>
                  <p className="text-sm text-emerald-600/70">{viewing.name_en || '—'}</p>
                </div>
                <button onClick={() => setViewing(null)} className="rounded-lg p-1.5 text-emerald-400 hover:bg-emerald-50">✕</button>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                {[
                  ['证件编号', viewing.document_no],
                  ['出生日期', viewing.date_of_birth],
                  ['性别', viewing.sex],
                  ['国籍', viewing.country],
                  ['发证机关', viewing.issue_org],
                  ['发证日期', viewing.issue_date],
                ].map(([k, v]) => (
                  <div key={k as string}>
                    <dt className="text-emerald-500">{k as string}</dt>
                    <dd className="mt-0.5 font-medium text-emerald-900">{v as string}</dd>
                  </div>
                ))}
                {viewing.mrz_text && (
                  <div className="col-span-2">
                    <dt className="text-emerald-500">机读码 MRZ</dt>
                    <dd className="mt-0.5 whitespace-pre-wrap font-mono text-xs text-emerald-900">{viewing.mrz_text}</dd>
                  </div>
                )}
              </dl>
              <button
                onClick={() => { setViewing(null); openEdit(viewing); }}
                className="mt-5 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
              >
                <Pencil className="h-4 w-4" /> 编辑
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
