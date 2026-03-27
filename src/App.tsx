import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useParams, Navigate } from 'react-router-dom';
import supabase from './lib/supabase';
import { handleGoogleRedirect } from './lib/googleAuth';
import Sidebar from './components/Sidebar';
import ProjectsPage from './pages/ProjectsPage';
import UnitsPage from './pages/UnitsPage';
import CutListPage from './pages/CutListPage';
import SettingsPage from './pages/SettingsPage';
import CostPage from './pages/CostPage';
import ExportPage from './pages/ExportPage';
import BoardsPage from './pages/BoardsPage';
import AccessoriesPage from './pages/AccessoriesPage';
import AdminPage from './pages/AdminPage';
import AuthPage from './pages/AuthPage';
import PwaInstallBanner from './components/PwaInstallBanner';
import SiteLogo from './components/SiteLogo';
import type { Project } from './types';

handleGoogleRedirect();

interface UserProfile {
  id: string;
  role: string;
  full_name: string;
  is_active: boolean;
}

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

/* ── Project pages wrapper ── */
function ProjectWrapper({
  component: Component,
  userProfile,
}: {
  component: React.ComponentType<any>;
  userProfile: UserProfile | null;
}) {
  const { projectId } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (projectId) {
      supabase.from('projects').select('*').eq('id', projectId).single()
        .then(({ data }) => setProject(data));
    }
  }, [projectId]);

  const handleMenuToggle = () => {
    if (window.innerWidth <= 768) setMobileOpen(v => !v);
    else setCollapsed(v => !v);
  };

  return (
    <div className="app-layout">
      <Sidebar
        projectId={Number(projectId)}
        projectName={project?.name}
        collapsed={collapsed}
        onToggle={handleMenuToggle}
        userProfile={userProfile}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <main className={`main-content ${collapsed ? 'expanded' : ''}`}>
        <Component
          onMenuToggle={handleMenuToggle}
          projectName={project?.name || ''}
        />
      </main>
    </div>
  );
}

/* ── Simple pages wrapper (home / admin) ── */
function SimpleWrapper({
  component: Component,
  userProfile,
}: {
  component: React.ComponentType<any>;
  userProfile: UserProfile | null;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleMenuToggle = () => {
    if (window.innerWidth <= 768) setMobileOpen(v => !v);
    else setCollapsed(v => !v);
  };

  return (
    <div className="app-layout">
      <Sidebar
        collapsed={collapsed}
        onToggle={handleMenuToggle}
        userProfile={userProfile}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <main className={`main-content ${collapsed ? 'expanded' : ''}`}>
        <Component onMenuToggle={handleMenuToggle} />
      </main>
    </div>
  );
}

/* ══════════════════════════════════════════
   ROOT APP
══════════════════════════════════════════ */
export default function App() {
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchProfile(session.user.id);
      else setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) fetchProfile(session.user.id);
      else { setUserProfile(null); setAuthLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('users_profile')
        .select('*')
        .eq('id', userId)
        .single();

      if (data) {
        setUserProfile(data);
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const newProfile = {
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'مستخدم',
            role: 'user',
            is_active: true,
          };
          await supabase.from('users_profile').insert(newProfile);
          setUserProfile(newProfile as UserProfile);
        }
      }
    } finally {
      setAuthLoading(false);
    }
  };

  /* ── Loading screen ── */
  if (authLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: '#0d2b20',
        flexDirection: 'column', gap: 24,
      }}>
        <SiteLogo size={64} showText={true} />
        <div className="spinner" style={{
          borderColor: 'rgba(255,255,255,0.12)',
          borderTopColor: '#00b5a3',
        }} />
      </div>
    );
  }

  /* ── Not logged in ── */
  if (!session) {
    return (
      <BrowserRouter>
        <AuthPage onAuth={() => {}} />
      </BrowserRouter>
    );
  }

  /* ── Account suspended ── */
  if (userProfile && !userProfile.is_active) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', fontFamily: 'Tajawal, sans-serif', background: '#f5f4ef',
      }}>
        <div style={{
          background: '#fff', padding: 40, borderRadius: 18,
          textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', maxWidth: 380,
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h2 style={{ color: '#ef4444', marginBottom: 12, fontSize: 20, fontWeight: 800 }}>
            الحساب موقوف
          </h2>
          <p style={{ color: '#6b7280', marginBottom: 24, fontSize: 14 }}>
            تم تعليق حسابك. تواصل مع المدير للمزيد من المعلومات.
          </p>
          <button
            onClick={() => supabase.auth.signOut()}
            style={{
              padding: '10px 28px', background: '#ef4444', color: 'white',
              border: 'none', borderRadius: 10, cursor: 'pointer',
              fontFamily: 'Tajawal, sans-serif', fontSize: 14, fontWeight: 700,
            }}
          >
            تسجيل الخروج
          </button>
        </div>
      </div>
    );
  }

  const isAdmin = userProfile?.role === 'admin';

  return (
    <BrowserRouter>
      <PwaInstallBanner />
      <Routes>
        <Route path="/"
          element={<SimpleWrapper component={ProjectsPage} userProfile={userProfile} />}
        />
        <Route path="/admin"
          element={isAdmin
            ? <SimpleWrapper component={AdminPage} userProfile={userProfile} />
            : <Navigate to="/" />
          }
        />
        <Route path="/project/:projectId/units"
          element={<ProjectWrapper component={UnitsPage} userProfile={userProfile} />}
        />
        <Route path="/project/:projectId/cutlist"
          element={<ProjectWrapper component={CutListPage} userProfile={userProfile} />}
        />
        <Route path="/project/:projectId/boards"
          element={<ProjectWrapper component={BoardsPage} userProfile={userProfile} />}
        />
        <Route path="/project/:projectId/accessories"
          element={<ProjectWrapper component={AccessoriesPage} userProfile={userProfile} />}
        />
        <Route path="/project/:projectId/settings"
          element={<ProjectWrapper component={SettingsPage} userProfile={userProfile} />}
        />
        <Route path="/project/:projectId/cost"
          element={<ProjectWrapper component={CostPage} userProfile={userProfile} />}
        />
        <Route path="/project/:projectId/export"
          element={<ProjectWrapper component={ExportPage} userProfile={userProfile} />}
        />
      </Routes>
    </BrowserRouter>
  );
}
