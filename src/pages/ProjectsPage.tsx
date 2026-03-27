import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Folder, Trash2, Edit2, ChevronLeft, Calendar, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import supabase from '../lib/supabase';
import type { Project } from '../types';

export default function ProjectsPage({ onMenuToggle }: { onMenuToggle: () => void }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [userGroups, setUserGroups] = useState<{id: number, name: string}[]>([]);
  const [form, setForm] = useState({ name: '', client_name: '', notes: '', group_id: null as number | null });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found in fetchProjects');
        return;
      }

      // fetch user groups
      const { data: ugData, error: ugError } = await supabase
        .from('user_groups')
        .select('group_id, groups(id, name)')
        .eq('user_id', user.id);
      
      if (ugError) console.error('Groups Fetch Error:', ugError);

      const flatGroups = (ugData || []).map((ug: any) => ug.groups).filter(Boolean);
      setUserGroups(flatGroups);
      const groupIds = flatGroups.map((g: any) => g.id);

      console.log('Fetching projects for user:', user.id, 'Groups:', groupIds);

      let query = supabase.from('projects').select('*');
      if (groupIds.length > 0) {
        query = query.or(`user_id.eq.${user.id},group_id.in.(${groupIds.join(',')})`);
      } else {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      console.log('Projects fetched:', data?.length || 0);
      setProjects(data || []);
    } catch (err: any) {
      console.error('Fetch Projects Error:', err);
      alert('خطأ في جلب المشاريع: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const openCreate = () => {
    setEditProject(null);
    setForm({ name: '', client_name: '', notes: '', group_id: null });
    setShowModal(true);
  };

  const openEdit = (p: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditProject(p);
    setForm({ name: p.name, client_name: p.client_name || '', notes: p.notes || '', group_id: p.group_id || null });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      alert('يرجى إدخال اسم المشروع أولاً');
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('حدث خطأ: لم يتم العثور على بيانات المستخدم. يرجى إعادة تسجيل الدخول.');
        return;
      }

      console.log('Inserting/Updating project...', { ...form, user_id: user.id });

      if (editProject) {
        const { error } = await supabase
          .from('projects')
          .update(form)
          .eq('id', editProject.id);
        if (error) throw error;
        alert('تم تحديث المشروع بنجاح');
      } else {
        const { error } = await supabase
          .from('projects')
          .insert({ ...form, user_id: user.id });
        if (error) throw error;
        alert('تم إنشاء المشروع بنجاح');
      }
      setShowModal(false);
      fetchProjects();
    } catch (err: any) {
      console.error('Project Save Error:', err);
      alert('حدث خطأ أثناء حفظ المشروع: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('هل أنت متأكد من حذف هذا المشروع؟')) return;
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchProjects();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="page">
      <Header
        title="المشاريع"
        subtitle="إدارة مشاريع التقطيع الخاصة بك"
        onMenuToggle={onMenuToggle}
        actions={
          <button className="btn-primary" onClick={openCreate}>
            <Plus size={16} />
            <span>مشروع جديد</span>
          </button>
        }
      />

      <div className="page-content">
        {loading ? (
          <LoadingSpinner />
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <Folder size={64} className="empty-icon" />
            <h3>لا توجد مشاريع بعد</h3>
            <p>ابدأ بإنشاء مشروع جديد لتفريغ مقاسات وحداتك</p>
            <button className="btn-primary" onClick={openCreate}>
              <Plus size={16} />
              <span>إنشاء مشروع جديد</span>
            </button>
          </div>
        ) : (
          <div className="projects-grid">
            <AnimatePresence>
              {projects.map(project => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="project-card"
                  onClick={() => navigate(`/project/${project.id}/units`)}
                >
                  <div className="project-card-header">
                    <div className="project-icon">
                      <Folder size={24} />
                    </div>
                    <div className="project-card-actions">
                      <button className="icon-btn-sm" onClick={(e) => openEdit(project, e)}>
                        <Edit2 size={14} />
                      </button>
                      <button className="icon-btn-sm danger" onClick={(e) => handleDelete(project.id, e)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <h3 className="project-title">{project.name}</h3>
                  {project.client_name && (
                    <div className="project-meta">
                      <User size={13} />
                      <span>{project.client_name}</span>
                    </div>
                  )}
                  <div className="project-meta">
                    <Calendar size={13} />
                    <span>{new Date(project.created_at).toLocaleDateString('ar-EG')}</span>
                  </div>
                  {project.notes && <p className="project-notes">{project.notes}</p>}
                  <div className="project-card-footer">
                    <span>فتح المشروع</span>
                    <ChevronLeft size={16} />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              className="modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <h2>{editProject ? 'تعديل المشروع' : 'مشروع جديد'}</h2>
              <div className="form-group">
                <label>اسم المشروع *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="مثال: مطبخ فيلا الرياض"
                />
              </div>
              <div className="form-group">
                <label>اسم العميل</label>
                <input
                  type="text"
                  value={form.client_name}
                  onChange={e => setForm({ ...form, client_name: e.target.value })}
                  placeholder="اسم العميل"
                />
              </div>
              <div className="form-group">
                <label>ملاحظات</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="ملاحظات إضافية..."
                  rows={3}
                />
              </div>
              {userGroups.length > 0 && (
                <div className="form-group">
                  <label>مشاركة مع مجموعة</label>
                  <select
                    value={form.group_id || ''}
                    onChange={e => setForm({ ...form, group_id: e.target.value ? Number(e.target.value) : null })}
                    style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1px solid #ddd', fontFamily: 'inherit' }}
                  >
                    <option value="">لا يوجد (خاص بي فقط)</option>
                    {userGroups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setShowModal(false)}>إلغاء</button>
                <button className="btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'جاري الحفظ...' : (editProject ? 'حفظ التعديلات' : 'إنشاء المشروع')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
