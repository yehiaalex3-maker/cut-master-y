import { useState, useEffect } from 'react';
import { Users, ToggleLeft, ToggleRight, Trash2, UserCheck, UserX, Settings, Shield, Plus, X } from 'lucide-react';
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
  user_email?: string;
}

export default function AdminPage({ onMenuToggle }: { onMenuToggle: () => void }) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [allowReg, setAllowReg] = useState(true);
  const [savingReg, setSavingReg] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [addingGroup, setAddingGroup] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchSettings();
    fetchGroups();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users_profile')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUsers(data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from('app_settings')
        .select('*')
        .eq('key', 'allow_registration')
        .single();
      
      if (data) setAllowReg(data.value === 'true');
    } catch (err) { console.error(err); }
  };

  const toggleReg = async () => {
    setSavingReg(true);
    const newVal = !allowReg;
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ key: 'allow_registration', value: String(newVal) }, { onConflict: 'key' });
      
      if (error) throw error;
      setAllowReg(newVal);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingReg(false);
    }
  };

  const toggleActive = async (user: UserProfile) => {
    try {
      const { error } = await supabase
        .from('users_profile')
        .update({ is_active: !user.is_active })
        .eq('id', user.id);
      
      if (error) throw error;
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const changeRole = async (user: UserProfile, role: string) => {
    try {
      const { error } = await supabase
        .from('users_profile')
        .update({ role })
        .eq('id', user.id);
      
      if (error) throw error;
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const fetchGroups = async () => {
    try {
      const { data: gData } = await supabase.from('groups').select('*').order('name');
      setGroups(gData || []);
      const { data: ugData } = await supabase.from('user_groups').select('*');
      setUserGroups(ugData || []);
    } catch (err) { console.error(err); }
  };

  const createGroup = async () => {
    if (!newGroupName.trim()) return;
    setAddingGroup(true);
    try {
      const { error } = await supabase.from('groups').insert({ name: newGroupName });
      if (error) throw error;
      setNewGroupName('');
      fetchGroups();
    } catch (err: any) { alert(err.message); }
    finally { setAddingGroup(false); }
  };

  const deleteGroup = async (id: number) => {
    if (!confirm('حذف هذه المجموعة وجميع روابط الأعضاء بها؟')) return;
    try {
      await supabase.from('groups').delete().eq('id', id);
      fetchGroups();
    } catch (err: any) { alert(err.message); }
  };

  const addUserToGroup = async (userId: string, groupId: number) => {
    try {
      const { error } = await supabase.from('user_groups').insert({ user_id: userId, group_id: groupId });
      if (error) throw error;
      fetchGroups();
    } catch (err: any) { alert('هذا المستخدم موجود بالفعل في المجموعة أو حدث خطأ'); }
  };

  const removeUserFromGroup = async (id: number) => {
    try {
      await supabase.from('user_groups').delete().eq('id', id);
      fetchGroups();
    } catch (err: any) { alert(err.message); }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('حذف هذا المستخدم نهائياً؟')) return;
    try {
      const { error } = await supabase
        .from('users_profile')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchUsers();
    } catch (err: any) { alert(err.message); }
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

        {/* Groups Management */}
        <motion.div className="admin-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="admin-card-header">
            <Shield size={20} />
            <div>
              <h3>إدارة المجموعات والفرق</h3>
              <p>إنشاء مجموعات عمل للتعاون بين المستخدمين</p>
            </div>
          </div>
          
          <div className="group-create-form" style={{ display: 'flex', gap: 10, marginBottom: 20, padding: 15, background: '#f8f8f8', borderRadius: 12 }}>
            <input 
              type="text" 
              placeholder="اسم المجموعة الجديدة..." 
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd' }}
            />
            <button className="btn-primary" onClick={createGroup} disabled={addingGroup} style={{ background: '#00b5a3', color: 'white', padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer' }}>
              <Plus size={16} style={{ marginLeft: 5 }} />
              إنشاء
            </button>
          </div>

          <div className="groups-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {groups.map(group => (
              <div key={group.id} className="group-item-card" style={{ border: '1px solid #eee', borderRadius: 12, padding: 15 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4 style={{ margin: 0, fontWeight: 800 }}>{group.name}</h4>
                  <button onClick={() => deleteGroup(group.id)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div className="group-members" style={{ fontSize: 13 }}>
                  <p style={{ color: '#666', marginBottom: 8 }}>الأعضاء:</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {userGroups.filter(ug => ug.group_id === group.id).map(ug => {
                      const u = users.find(usr => usr.id === ug.user_id);
                      return (
                        <div key={ug.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', background: '#f0fdfa', borderRadius: 6 }}>
                          <span>{u?.full_name || u?.email || 'مستخدم غير معروف'}</span>
                          <button onClick={() => removeUserFromGroup(ug.id)} style={{ color: '#999', border: 'none', background: 'none', cursor: 'pointer' }}>
                            <X size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ marginTop: 15, paddingTop: 10, borderTop: '1px solid #f0f0f0' }}>
                  <select 
                    className="add-to-group-select"
                    onChange={(e) => {
                      if (e.target.value) addUserToGroup(e.target.value, group.id);
                      e.target.value = '';
                    }}
                    style={{ width: '100%', padding: '6px', borderRadius: 6, fontSize: 12 }}
                  >
                    <option value="">+ إضافة مستخدم للمجموعة</option>
                    {users.filter(u => !userGroups.some(ug => ug.group_id === group.id && ug.user_id === u.id)).map(u => (
                      <option key={u.id} value={u.id}>{u.full_name || u.email}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
