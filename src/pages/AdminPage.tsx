import { useState, useEffect } from 'react';
import { Users, ToggleLeft, ToggleRight, Trash2, UserCheck, UserX, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import supabase from '../lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export default function AdminPage({ onMenuToggle }: { onMenuToggle: () => void }) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [allowReg, setAllowReg] = useState(true);
  const [savingReg, setSavingReg] = useState(false);
  const [token, setToken] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) {
        setToken(session.access_token);
        fetchUsers(session.access_token);
        fetchSettings();
      }
    });
  }, []);

  const fetchUsers = async (t: string) => {
    try {
      const res = await fetch('/api/admin-users', { headers: { Authorization: `Bearer ${t}` } });
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchSettings = async () => {
    const res = await fetch('/api/app-settings');
    const data = await res.json();
    setAllowReg(data.allow_registration === 'true');
  };

  const toggleReg = async () => {
    setSavingReg(true);
    const newVal = !allowReg;
    const { data: { session } } = await supabase.auth.getSession();
    await fetch('/api/app-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ key: 'allow_registration', value: String(newVal) }),
    });
    setAllowReg(newVal);
    setSavingReg(false);
  };

  const toggleActive = async (user: UserProfile) => {
    await fetch('/api/admin-users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: user.id, role: user.role, is_active: !user.is_active, full_name: user.full_name }),
    });
    fetchUsers(token);
  };

  const changeRole = async (user: UserProfile, role: string) => {
    await fetch('/api/admin-users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: user.id, role, is_active: user.is_active, full_name: user.full_name }),
    });
    fetchUsers(token);
  };

  const deleteUser = async (id: string) => {
    if (!confirm('حذف هذا المستخدم نهائياً؟')) return;
    await fetch('/api/admin-users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id }),
    });
    fetchUsers(token);
  };

  return (
    <div className="page">
      <Header title="لوحة التحكم" subtitle="إدارة المستخدمين وإعدادات النظام" onMenuToggle={onMenuToggle} />
      <div className="page-content">
        {/* Registration Control */}
        <motion.div className="admin-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="admin-card-header">
            <Settings size={20} />
            <div>
              <h3>إعدادات النظام</h3>
              <p>التحكم في إمكانية تسجيل مستخدمين جدد</p>
            </div>
          </div>
          <div className="admin-setting-row">
            <div>
              <span className="setting-label">السماح بالتسجيل</span>
              <p className="setting-desc">عند التعطيل لن يتمكن أحد من إنشاء حساب جديد</p>
            </div>
            <button
              className={`toggle-reg-btn ${allowReg ? 'on' : 'off'}`}
              onClick={toggleReg}
              disabled={savingReg}
            >
              {allowReg ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
              <span>{allowReg ? 'مفتوح' : 'مغلق'}</span>
            </button>
          </div>
        </motion.div>

        {/* Users List */}
        <motion.div className="admin-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="admin-card-header">
            <Users size={20} />
            <div>
              <h3>المستخدمون ({users.length})</h3>
              <p>إدارة حسابات المستخدمين وصلاحياتهم</p>
            </div>
          </div>
          {loading ? <LoadingSpinner /> : (
            <div className="users-table-wrap">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>المستخدم</th>
                    <th>البريد</th>
                    <th>الدور</th>
                    <th>الحالة</th>
                    <th>تاريخ التسجيل</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className={!user.is_active ? 'inactive-row' : ''}>
                      <td>
                        <div className="user-info">
                          <div className={`user-avatar ${user.role === 'admin' ? 'admin' : ''}`}>
                            {(user.full_name || user.email || '?')[0].toUpperCase()}
                          </div>
                          <span>{user.full_name || '-'}</span>
                        </div>
                      </td>
                      <td dir="ltr" style={{ textAlign: 'right' }}>{user.email}</td>
                      <td>
                        <select
                          value={user.role}
                          onChange={e => changeRole(user, e.target.value)}
                          className="role-select"
                        >
                          <option value="user">مستخدم</option>
                          <option value="admin">مدير</option>
                        </select>
                      </td>
                      <td>
                        <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                          {user.is_active ? 'نشط' : 'موقوف'}
                        </span>
                      </td>
                      <td className="dim-cell">{new Date(user.created_at).toLocaleDateString('ar-EG')}</td>
                      <td>
                        <div className="row-actions">
                          <button className="icon-btn-sm" onClick={() => toggleActive(user)} title={user.is_active ? 'تعطيل' : 'تفعيل'}>
                            {user.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                          </button>
                          <button className="icon-btn-sm danger" onClick={() => deleteUser(user.id)}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
