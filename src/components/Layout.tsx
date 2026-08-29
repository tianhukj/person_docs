import { useState, type ReactNode } from 'react';
import { useAuth } from '@/lib/auth';
import { Users, ClipboardCheck, LogOut, ShieldCheck } from 'lucide-react';

type Tab = 'persons' | 'tasks';

export default function Layout({
  tab,
  onTab,
  children,
}: {
  tab: Tab;
  onTab: (t: Tab) => void;
  children: ReactNode;
}) {
  const { logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItem = (id: Tab, label: string, icon: ReactNode) => (
    <button
      onClick={() => { onTab(id); setMobileOpen(false); }}
      className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
        tab === id
          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-300/40'
          : 'text-emerald-700 hover:bg-emerald-50'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50/50 to-green-50">
      {/* top bar (mobile) */}
      <div className="flex items-center justify-between border-b border-emerald-100 bg-white/70 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2 font-semibold text-emerald-900">
          <ShieldCheck className="h-5 w-5 text-emerald-500" />
          人员信息录入系统
        </div>
        <button onClick={() => setMobileOpen((o) => !o)} className="rounded-lg p-1.5 text-emerald-700 hover:bg-emerald-50">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
        </button>
      </div>

      <div className="flex">
        {/* sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-emerald-100 bg-white/80 backdrop-blur-md transition-transform lg:static lg:translate-x-0 ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-3 px-6 py-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-md shadow-emerald-300/40">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-900">人员信息录入</p>
                <p className="text-xs text-emerald-500">Admin Console</p>
              </div>
            </div>

            <nav className="flex-1 space-y-1.5 px-3 py-4">
              {navItem('persons', '人员档案', <Users className="h-4.5 w-4.5" />)}
              {navItem('tasks', '核验任务', <ClipboardCheck className="h-4.5 w-4.5" />)}
            </nav>

            <div className="border-t border-emerald-100 px-3 py-4">
              <div className="mb-3 flex items-center gap-2 px-3 text-xs text-emerald-600/70">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">A</div>
                <span>admin 已登录</span>
              </div>
              <button
                onClick={logout}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-red-500 transition hover:bg-red-50"
              >
                <LogOut className="h-4.5 w-4.5" /> 退出登录
              </button>
            </div>
          </div>
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-30 bg-emerald-950/20 lg:hidden" onClick={() => setMobileOpen(false)} />
        )}

        {/* main */}
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
