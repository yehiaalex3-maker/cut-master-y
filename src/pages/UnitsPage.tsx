import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Trash2, Edit2, Copy, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import supabase from '../lib/supabase';
import type { Unit } from '../types';

const UNIT_CATEGORIES = {
  'أرضي': ['خزانة سفلية', 'وحدة حوض', 'ارضي ثابت', 'حوض ثابت', 'ادراج', 'ادراج م سفلية', 'ركنه ل ارضي', 'وحدة م جرح جانبية + ضلف', 'وحدة م جرح م سفلية + ضلف'],
  'دواليب (Tall Units)': ['دواليب عادي', 'دواليب ادراج', 'دواليب كورنر'],
  'علوي': ['خزانة علوية', 'خزانة علوية ادراج', 'ركنه علوية', 'خزانة فوق الثلاجة'],
  'ديكور': ['ديكور جانبي', 'ديكور علوي', 'رف ديكور'],
};

const DOOR_CODE_TYPES = ['افتراضى', 'Basic - كود أساسى', 'Add1 - كود إضافي 1', 'Add2 - كود إضافي 2'];
const CHASSIS_CODE_TYPES = ['افتراضى', 'Basic', 'Add1', 'Add2'];
const DUMMY_SIDE_OPTIONS = ['بدون جنب عبرة (افتراضى)', 'جنب عبرة يمين', 'جنب عبرة يسار', 'جنب عبرة الجانبين'];
const FRONT_TAPE_COLORS = ['افتراضى', 'أبيض', 'بيج', 'رمادي', 'أسود', 'خشبي'];

const DEFAULT_UNIT: Omit<Unit, 'id' | 'created_at'> = {
  project_id: 0,
  unit_type: 'خزانة سفلية',
  unit_category: 'أرضي',
  quantity: 1,
  width: 0,
  height: 0,
  depth: 0,
  shelves_count: 1,
  drawers_count: 0,
  door_code_type: 'افتراضى',
  chassis_code_type: 'افتراضى',
  dummy_side: 'بدون جنب عبرة (افتراضى)',
  front_tape_color: 'افتراضى',
  has_glass_door: false,
  has_glass_shelf: false,
  notes: '',
  sort_order: 0,
};

const UNIT_IMAGES: Record<string, string> = {
  'خزانة سفلية': '🗄️',
  'وحدة حوض': '🚿',
  'ارضي ثابت': '📦',
  'ادراج': '🗂️',
  'دواليب عادي': '🚪',
  'خزانة علوية': '🗃️',
  'رف ديكور': '📚',
  'ديكور جانبي': '🎨',
};

function getUnitEmoji(type: string) {
  return UNIT_IMAGES[type] || '📦';
}

export default function UnitsPage({ onMenuToggle, projectName }: { onMenuToggle: () => void; projectName: string }) {
  const { projectId } = useParams();
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUnit, setEditUnit] = useState<Unit | null>(null);
  const [form, setForm] = useState({ ...DEFAULT_UNIT });
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('أرضي');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const fetchUnits = async () => {
    try {
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      setUnits(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUnits(); }, [projectId]);

  const openCreate = () => {
    setEditUnit(null);
    setForm({ ...DEFAULT_UNIT, project_id: Number(projectId), sort_order: units.length });
    setSelectedCategory('أرضي');
    setShowModal(true);
  };

  const openEdit = (u: Unit) => {
    setEditUnit(u);
    setForm({ ...u });
    setSelectedCategory(u.unit_category);
    setShowModal(true);
  };

  const handleDuplicate = async (u: Unit) => {
    const { id, created_at, ...rest } = u;
    try {
      const { error } = await supabase
        .from('units')
        .insert({ ...rest, sort_order: units.length });
      if (error) throw error;
      fetchUnits();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    if (!form.width || !form.height || !form.depth) {
      alert('يرجى إدخال الأبعاد (العرض والارتفاع والعمق)');
      return;
    }
    setSaving(true);
    try {
      if (editUnit) {
        const { error } = await supabase
          .from('units')
          .update(form)
          .eq('id', editUnit.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('units')
          .insert(form);
        if (error) throw error;
      }
      setShowModal(false);
      fetchUnits();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه الوحدة؟')) return;
    try {
      const { error } = await supabase
        .from('units')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchUnits();
    } catch (err) {
      console.error(err);
    }
  };

  const setUnitType = (type: string) => {
    setForm(prev => ({ ...prev, unit_type: type, unit_category: selectedCategory }));
    setShowCategoryDropdown(false);
  };

  return (
    <div className="page">
      <Header
        title="تفريغ المقاسات"
        subtitle={`مشروع: ${projectName}`}
        onMenuToggle={onMenuToggle}
        actions={
          <button className="btn-primary" onClick={openCreate}>
            <Plus size={16} />
            <span>إضافة وحدة</span>
          </button>
        }
      />

      <div className="page-content">
        {loading ? (
          <LoadingSpinner />
        ) : units.length === 0 ? (
          <div className="empty-state">
            <span style={{ fontSize: 64 }}>📐</span>
            <h3>لا توجد وحدات بعد</h3>
            <p>أضف وحداتك الخشبية لبدء تفريغ المقاسات</p>
            <button className="btn-primary" onClick={openCreate}>
              <Plus size={16} />
              <span>إضافة وحدة جديدة</span>
            </button>
          </div>
        ) : (
          <div className="units-table-container">
            <table className="units-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>نوع الوحدة</th>
                  <th>الكمية</th>
                  <th>العرض (سم)</th>
                  <th>الارتفاع (سم)</th>
                  <th>العمق (سم)</th>
                  <th>الرفوف</th>
                  <th>الأدراج</th>
                  <th>كود الضلفة</th>
                  <th>ملاحظات</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {units.map((unit, idx) => (
                    <motion.tr
                      key={unit.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="unit-row"
                    >
                      <td className="unit-num">{idx + 1}</td>
                      <td>
                        <div className="unit-type-cell">
                          <span className="unit-emoji">{getUnitEmoji(unit.unit_type)}</span>
                          <div>
                            <div className="unit-type-name">{unit.unit_type}</div>
                            <div className="unit-category-badge">{unit.unit_category}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="qty-badge">{unit.quantity}</span></td>
                      <td className="dim-cell">{unit.width}</td>
                      <td className="dim-cell">{unit.height}</td>
                      <td className="dim-cell">{unit.depth}</td>
                      <td className="dim-cell">{unit.shelves_count}</td>
                      <td className="dim-cell">{unit.drawers_count}</td>
                      <td><span className="code-badge">{unit.door_code_type}</span></td>
                      <td className="notes-cell">{unit.notes || '-'}</td>
                      <td>
                        <div className="row-actions">
                          <button className="icon-btn-sm" onClick={() => openEdit(unit)} title="تعديل">
                            <Edit2 size={14} />
                          </button>
                          <button className="icon-btn-sm" onClick={() => handleDuplicate(unit)} title="نسخ">
                            <Copy size={14} />
                          </button>
                          <button className="icon-btn-sm danger" onClick={() => handleDelete(unit.id)} title="حذف">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
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
              className="modal modal-large"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>{editUnit ? 'تعديل الوحدة' : 'إضافة وحدة جديدة'}</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
              </div>

              <div className="modal-body">
                {/* Unit Type Selector */}
                <div className="form-section">
                  <label className="section-label">نوع الوحدة</label>
                  <div className="unit-type-selector">
                    <button
                      className="unit-type-btn"
                      onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    >
                      <span>{form.unit_type}</span>
                      <ChevronDown size={16} />
                    </button>
                    {showCategoryDropdown && (
                      <div className="unit-type-dropdown">
                        {Object.entries(UNIT_CATEGORIES).map(([cat, types]) => (
                          <div key={cat}>
                            <div
                              className="category-header"
                              onClick={() => setSelectedCategory(cat)}
                            >
                              {cat}
                            </div>
                            {types.map(type => (
                              <div
                                key={type}
                                className={`type-option ${form.unit_type === type ? 'selected' : ''}`}
                                onClick={() => setUnitType(type)}
                              >
                                {type}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quantity */}
                <div className="form-section">
                  <label className="section-label">عدد الوحدات المراد إضافتها (نسخ بنفس المواصفات)</label>
                  <input
                    type="number"
                    min={1}
                    value={form.quantity}
                    onChange={e => setForm({ ...form, quantity: Number(e.target.value) })}
                    className="form-input"
                  />
                </div>

                {/* Dimensions */}
                <div className="form-section">
                  <div className="dims-grid">
                    <div className="form-group">
                      <label>العرض (سم)</label>
                      <input type="number" value={form.width || ''} onChange={e => setForm({ ...form, width: Number(e.target.value) })} className="form-input" placeholder="0" />
                    </div>
                    <div className="form-group">
                      <label>الارتفاع (سم)</label>
                      <input type="number" value={form.height || ''} onChange={e => setForm({ ...form, height: Number(e.target.value) })} className="form-input" placeholder="0" />
                    </div>
                    <div className="form-group">
                      <label>العمق (سم)</label>
                      <input type="number" value={form.depth || ''} onChange={e => setForm({ ...form, depth: Number(e.target.value) })} className="form-input" placeholder="0" />
                    </div>
                  </div>
                </div>

                {/* Shelves & Drawers */}
                <div className="form-section">
                  <div className="dims-grid">
                    <div className="form-group">
                      <label>عدد الرفوف</label>
                      <input type="number" min={0} value={form.shelves_count} onChange={e => setForm({ ...form, shelves_count: Number(e.target.value) })} className="form-input" />
                    </div>
                    <div className="form-group">
                      <label>عدد الضلف</label>
                      <input type="number" min={0} value={form.drawers_count} onChange={e => setForm({ ...form, drawers_count: Number(e.target.value) })} className="form-input" />
                    </div>
                  </div>
                </div>

                {/* Codes */}
                <div className="form-section">
                  <div className="dims-grid">
                    <div className="form-group">
                      <label>نوع كود الضلفة</label>
                      <select value={form.door_code_type} onChange={e => setForm({ ...form, door_code_type: e.target.value })} className="form-select">
                        {DOOR_CODE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>نوع كود الشاسيه</label>
                      <select value={form.chassis_code_type} onChange={e => setForm({ ...form, chassis_code_type: e.target.value })} className="form-select">
                        {CHASSIS_CODE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Dummy Side & Tape */}
                <div className="form-section">
                  <div className="dims-grid">
                    <div className="form-group">
                      <label>جنب عبرة (Dummy Side)</label>
                      <select value={form.dummy_side} onChange={e => setForm({ ...form, dummy_side: e.target.value })} className="form-select">
                        {DUMMY_SIDE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>لون الشريط الامامي</label>
                      <select value={form.front_tape_color} onChange={e => setForm({ ...form, front_tape_color: e.target.value })} className="form-select">
                        {FRONT_TAPE_COLORS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Glass Options */}
                <div className="form-section">
                  <label className="section-label">خيارات الزجاج</label>
                  <div className="toggle-grid">
                    <label className="toggle-item">
                      <div className="toggle-info">
                        <span>ضلف زجاج</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={form.has_glass_door}
                        onChange={e => setForm({ ...form, has_glass_door: e.target.checked })}
                        className="toggle-input"
                      />
                      <div className={`toggle-switch ${form.has_glass_door ? 'on' : ''}`}></div>
                    </label>
                    <label className="toggle-item">
                      <div className="toggle-info">
                        <span>أرفف زجاج</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={form.has_glass_shelf}
                        onChange={e => setForm({ ...form, has_glass_shelf: e.target.checked })}
                        className="toggle-input"
                      />
                      <div className={`toggle-switch ${form.has_glass_shelf ? 'on' : ''}`}></div>
                    </label>
                  </div>
                </div>

                {/* Notes */}
                <div className="form-section">
                  <label className="section-label">ملاحظات</label>
                  <textarea
                    value={form.notes || ''}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    className="form-textarea"
                    rows={2}
                    placeholder="ملاحظات إضافية على الوحدة..."
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setShowModal(false)}>إلغاء</button>
                <button className="btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'جاري الحفظ...' : (editUnit ? 'حفظ التعديلات' : 'إضافة الوحدة')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
