import { useState, useEffect } from 'react';
import {
  Users, ToggleLeft, ToggleRight, Trash2,
  UserCheck, UserX, Settings, Shield, Plus, X,
  Crown, RefreshCw, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

interface Group {
  id: number;
  name: string;
  created_at: string;
}

interface UserGroup {
  id: number;
  user_id: string;
  group_id: number;
  role: string;
}

export default function AdminPage({ onMenuToggle }: { onMenuToggle: () => void }) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allowReg, setAllowReg] = useState(true);
  const [savingReg, setSavingReg] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [addingGroup, setAddingGroup] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'groups'>('users');
  const [savingUser, setSavingUser] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadAll = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    await Promise.all([fetchUsers(), fetchSettings(), fetchGroups()]);
    if (!silent) setLoading(false);
    else setRefreshing(false);
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users_profile')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setUsers(data || []);
    } catch (err) { console.error(err); }
  };

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from('app_settings')
        .select('*')
        .eq('key', 'allow_registration')
        .single();
      if (data) {
        // Handle both string and boolean values
        const val = data.value;
        setAllowReg(val === true || val === 'true');
      }
    } catch (err) { console.error(err); }
  };

  const fetchGroups = async () => {
    try {
      const { data: gData } = await supabase.from('groups').select('*').order('name');
      setGroups(gData || []);
      const { data: ugData } = await supabase.from('user_groups').select('*');
      setUserGroups(ugData || []);
    } catch (err) { console.error(err); }
  };

  // ─── Reg Toggle ───
  const toggleReg = async () => {
    setSavingReg(true);
    const newVal = !allowReg;
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ key: 'allow_registration', value: newVal }, { onConflict: 'key' });
      if (error) throw error;
      setAllowReg(newVal);
      showToast(newVal ? '✅ تم فتح التسجيل' : '🔒 تم غلق التسجيل');
    } catch (err: any) {
      console.error(err);
      showToast('فشل تغيير الإعداد: ' + err.message, 'error');
    } finally {
      setSavingReg(false);
    }
  };

  // ─── Change Role ───
  const changeRole = async (user: UserProfile, role: string) => {
    setSavingUser(user.id);
    try {
      const { error } = await supabase
        .from('users_profile')
        .update({ role })
        .eq('id', user.id);
      if (error) throw error;
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role } : u));
      showToast(`✅ تم تغيير دور ${user.full_name || user.email} إلى ${role === 'admin' ? 'مدير' : 'مستخدم'}`);
    } catch (err: any) {
      showToast('فشل تغيير الدور: ' + err.message, 'error');
    } finally {
      setSavingUser(null);
    }
  };

  // ─── Toggle Active ───
  const toggleActive = async (user: UserProfile) => {
    setSavingUser(user.id);
    try {
      const { error } = await supabase
        .from('users_profile')
        .update({ is_active: !user.is_active })
        .eq('id', user.id);
      if (error) throw error;
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u));
      showToast(user.is_active ? '🔒 تم تعليق الحساب' : '✅ تم تفعيل الحساب');
    } catch (err: any) {
      showToast('فشل: ' + err.message, 'error');
    } finally {
      setSavingUser(null);
    }
  };

  // ─── Delete User (profile only; full auth delete requires service role) ───
  const deleteUser = async (user: UserProfile) => {
    if (!confirm(`هل أنت متأكد من حذف مستخدم "${user.full_name || user.email}" نهائياً؟\n\nسيتم حذف بياناته من النظام.`)) return;
    setSavingUser(user.id);
    try {
      const { error } = await supabase
        .from('users_profile')
        .delete()
        .eq('id', user.id);
      if (error) throw error;
      setUsers(prev => prev.filter(u => u.id !== user.id));
      showToast('🗑️ تم حذف المستخدم');
    } catch (err: any) {
      showToast('فشل الحذف: ' + err.message, 'error');
    } finally {
      setSavingUser(null);
    }
  };

  // ─── Groups ───
  const createGroup = async () => {
    if (!newGroupName.trim()) return;
    setAddingGroup(true);
    try {
      const { error } = await supabase.from('groups').insert({ name: newGroupName.trim() });
      if (error) throw error;
      setNewGroupName('');
      fetchGroups();
      showToast('✅ تم إنشاء المجموعة');
    } catch (err: any) {
      showToast('فشل: ' + err.message, 'error');
    } finally {
      setAddingGroup(false);
    }
  };

  const deleteGroup = async (id: number, name: string) => {
    if (!confirm(`حذف مجموعة "${name}" وجميع روابط أعضائها؟`)) return;
    try {
      await supabase.from('groups').delete().eq('id', id);
      fetchGroups();
      showToast('🗑️ تم حذف المجموعة');
    } catch (err: any) {
      showToast('فشل: ' + err.message, 'error');
    }
  };

  const addUserToGroup = async (userId: string, groupId: number) => {
    try {
      const { error } = await supabase.from('user_groups').insert({ user_id: userId, group_id: groupId });
      if (error) throw error;
      fetchGroups();
      showToast('✅ تمت إضافة المستخدم للمجموعة');
    } catch {
      showToast('هذا المستخدم موجود بالفعل في المجموعة', 'error');
    }
  };

  const removeUserFromGroup = async (id: number) => {
    try {
      await supabase.from('user_groups').delete().eq('id', id);
      fetchGroups();
      showToast('تم إزالة المستخدم من المجموعة');
    } catch (err: any) {
      showToast('فشل: ' + err.message, 'error');
    }
  };

  // ─── Filtered users ───
  const filteredUsers = users.filter(u => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.email?.toLowerCase().includes(q) ||
      u.full_name?.toLowerCase().includes(q)
    );
  });

  const adminCount = users.filter(u => u.role === 'admin').length;
  const activeCount = users.filter(u => u.is_active).length;

  if (loading) {
    return (
      <div className="page">
        <Header title="لوحة التحكم" subtitle="إدارة المستخدمين وإعدادات النظام" onMenuToggle={onMenuToggle} />
        <div className="page-content"><LoadingSpinner /></div>
      </div>
    );
  }

  return (
    <div className="page">
      <Header
        title="لوحة التحكم"
        subtitle="إدارة المستخدمين وإعدادات النظام"
        onMenuToggle={onMenuToggle}
        actions={
          <button
            className="btn-secondary"
            onClick={() => loadAll(true)}
            disabled={refreshing}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
            <span>تحديث</span>
          </button>
        }
      />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            style={{
              position: 'fixed', top: 20, left: '50%',
              zIndex: 9999, padding: '12px 24px',
              borderRadius: 12, fontFamily: 'Tajawal, sans-serif',
              fontSize: 14, fontWeight: 700, boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              background: toast.type === 'error' ? '#ef4444' : '#00b5a3',
              color: 'white', whiteSpace: 'nowrap',
            }}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="page-content">

        {/* Stats Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'إجمالي المستخدمين', value: users.length, icon: '👥', color: '#3b82f6' },
            { label: 'المستخدمون النشطون', value: activeCount, icon: '✅', color: '#10b981' },
            { label: 'المديرون', value: adminCount, icon: '👑', color: '#f59e0b' },
            { label: 'المجموعات', value: groups.length, icon: '🏢', color: '#8b5cf6' },
            { label: 'التسجيل', value: allowReg ? 'مفتوح' : 'مغلق', icon: allowReg ? '🟢' : '🔴', color: allowReg ? '#10b981' : '#ef4444' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{
                background: 'white', borderRadius: 14, padding: '16px 20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)', textAlign: 'center',
                border: `2px solid ${stat.color}22`,
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 4 }}>{stat.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* System Settings */}
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

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 0 }}>
          {[
            { id: 'users', label: `المستخدمون (${users.length})`, icon: <Users size={16} /> },
            { id: 'groups', label: `المجموعات (${groups.length})`, icon: <Shield size={16} /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', border: 'none', cursor: 'pointer',
                borderRadius: '12px 12px 0 0', fontFamily: 'Tajawal, sans-serif',
                fontSize: 14, fontWeight: 700, transition: 'all 0.2s',
                background: activeTab === tab.id ? 'white' : '#f0f0ec',
                color: activeTab === tab.id ? '#00b5a3' : '#6b7280',
                borderBottom: activeTab === tab.id ? '2px solid #00b5a3' : '2px solid transparent',
                boxShadow: activeTab === tab.id ? '0 -2px 8px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Users Tab */}
        <AnimatePresence mode="wait">
          {activeTab === 'users' && (
            <motion.div
              key="users"
              className="admin-card"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{ borderRadius: '0 12px 12px 12px' }}
            >
              {/* Search */}
              <div style={{ position: 'relative', marginBottom: 20 }}>
                <Search size={16} style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)', color: '#9ca3af',
                }} />
                <input
                  type="text"
                  placeholder="البحث بالاسم أو البريد الإلكتروني..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 40px 10px 12px',
                    borderRadius: 10, border: '1px solid #e5e7eb',
                    fontFamily: 'Tajawal, sans-serif', fontSize: 14,
                    background: '#f9f9f9', boxSizing: 'border-box',
                  }}
                />
              </div>

              <div className="users-table-wrap">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>المستخدم</th>
                      <th>البريد الإلكتروني</th>
                      <th>الدور</th>
                      <th>الحالة</th>
                      <th>تاريخ التسجيل</th>
                      <th>إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#9ca3af' }}>
                          لا توجد نتائج
                        </td>
                      </tr>
                    ) : filteredUsers.map(user => (
                      <tr key={user.id} className={!user.is_active ? 'inactive-row' : ''}>
                        <td>
                          <div className="user-info">
                            <div className={`user-avatar ${user.role === 'admin' ? 'admin' : ''}`}>
                              {user.role === 'admin'
                                ? <Crown size={14} />
                                : (user.full_name || user.email || '?')[0].toUpperCase()
                              }
                            </div>
                            <span>{user.full_name || '—'}</span>
                          </div>
                        </td>
                        <td dir="ltr" style={{ textAlign: 'right', fontSize: 13, color: '#4b5563' }}>
                          {user.email}
                        </td>
                        <td>
                          <select
                            value={user.role}
                            onChange={e => changeRole(user, e.target.value)}
                            className="role-select"
                            disabled={savingUser === user.id}
                          >
                            <option value="user">👤 مستخدم</option>
                            <option value="admin">👑 مدير</option>
                          </select>
                        </td>
                        <td>
                          <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                            {user.is_active ? 'نشط' : 'موقوف'}
                          </span>
                        </td>
                        <td className="dim-cell">
                          {new Date(user.created_at).toLocaleDateString('ar-EG')}
                        </td>
                        <td>
                          <div className="row-actions">
                            {savingUser === user.id ? (
                              <span className="btn-spinner" style={{ borderTopColor: '#00b5a3' }} />
                            ) : (
                              <>
                                <button
                                  className="icon-btn-sm"
                                  onClick={() => toggleActive(user)}
                                  title={user.is_active ? 'تعليق الحساب' : 'تفعيل الحساب'}
                                >
                                  {user.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                                </button>
                                <button
                                  className="icon-btn-sm danger"
                                  onClick={() => deleteUser(user)}
                                  title="حذف المستخدم"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Groups Tab */}
          {activeTab === 'groups' && (
            <motion.div
              key="groups"
              className="admin-card"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{ borderRadius: '0 12px 12px 12px' }}
            >
              {/* Create Group */}
              <div style={{
                display: 'flex', gap: 10, marginBottom: 24,
                padding: '16px', background: '#f8f9fa', borderRadius: 12,
                border: '1px dashed #d1d5db',
              }}>
                <input
                  type="text"
                  placeholder="اسم المجموعة الجديدة..."
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && createGroup()}
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: 10,
                    border: '1px solid #e5e7eb', fontFamily: 'Tajawal, sans-serif',
                    fontSize: 14,
                  }}
                />
                <button
                  onClick={createGroup}
                  disabled={addingGroup || !newGroupName.trim()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '10px 20px', background: '#00b5a3', color: 'white',
                    border: 'none', borderRadius: 10, cursor: 'pointer',
                    fontFamily: 'Tajawal, sans-serif', fontSize: 14, fontWeight: 700,
                    opacity: !newGroupName.trim() ? 0.5 : 1,
                  }}
                >
                  <Plus size={16} />
                  إنشاء
                </button>
              </div>

              {groups.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
                  <Shield size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
                  <p>لا توجد مجموعات بعد</p>
                </div>
              ) : (
                <div className="groups-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                  {groups.map(group => {
                    const members = userGroups.filter(ug => ug.group_id === group.id);
                    return (
                      <div
                        key={group.id}
                        style={{
                          border: '1px solid #e5e7eb', borderRadius: 14,
                          padding: '16px', background: '#fafafa',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <div>
                            <h4 style={{ margin: 0, fontWeight: 800, fontSize: 16 }}>{group.name}</h4>
                            <span style={{ fontSize: 12, color: '#9ca3af' }}>
                              {members.length} {members.length === 1 ? 'عضو' : 'أعضاء'}
                            </span>
                          </div>
                          <button
                            onClick={() => deleteGroup(group.id, group.name)}
                            style={{
                              color: '#ef4444', border: 'none', background: 'none',
                              cursor: 'pointer', padding: 6, borderRadius: 8,
                              display: 'flex', alignItems: 'center',
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {/* Members */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                          {members.map(ug => {
                            const u = users.find(usr => usr.id === ug.user_id);
                            return (
                              <div
                                key={ug.id}
                                style={{
                                  display: 'flex', justifyContent: 'space-between',
                                  alignItems: 'center', padding: '6px 10px',
                                  background: '#f0fdfa', borderRadius: 8, fontSize: 13,
                                  border: '1px solid #ccfbf1',
                                }}
                              >
                                <span style={{ fontWeight: 600 }}>
                                  {u?.full_name || u?.email || 'مستخدم غير معروف'}
                                </span>
                                <button
                                  onClick={() => removeUserFromGroup(ug.id)}
                                  style={{
                                    color: '#9ca3af', border: 'none', background: 'none',
                                    cursor: 'pointer', padding: 2, display: 'flex',
                                  }}
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            );
                          })}
                          {members.length === 0 && (
                            <p style={{ color: '#9ca3af', fontSize: 12, margin: 0, textAlign: 'center', padding: '8px 0' }}>
                              لا يوجد أعضاء بعد
                            </p>
                          )}
                        </div>

                        {/* Add user to group */}
                        <select
                          onChange={e => {
                            if (e.target.value) {
                              addUserToGroup(e.target.value, group.id);
                              e.target.value = '';
                            }
                          }}
                          style={{
                            width: '100%', padding: '8px 10px', borderRadius: 8,
                            border: '1px solid #d1d5db', fontFamily: 'Tajawal, sans-serif',
                            fontSize: 13, background: 'white', cursor: 'pointer',
                          }}
                        >
                          <option value="">+ إضافة مستخدم للمجموعة</option>
                          {users
                            .filter(u => !userGroups.some(ug => ug.group_id === group.id && ug.user_id === u.id))
                            .map(u => (
                              <option key={u.id} value={u.id}>
                                {u.full_name || u.email}
                              </option>
                            ))
                          }
                        </select>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
