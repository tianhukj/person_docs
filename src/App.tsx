import { useState } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth';
import LoginPage from '@/pages/LoginPage';
import Layout from '@/components/Layout';
import PersonRecordsPage from '@/pages/PersonRecordsPage';
import VerifyTasksPage from '@/pages/VerifyTasksPage';

type Tab = 'persons' | 'tasks';

function Shell() {
  const { isAuthenticated } = useAuth();
  const [tab, setTab] = useState<Tab>('persons');

  if (!isAuthenticated) return <LoginPage />;

  return (
    <Layout tab={tab} onTab={setTab}>
      {tab === 'persons' ? (
        <PersonRecordsPage onNavigate={setTab} />
      ) : (
        <VerifyTasksPage />
      )}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}
