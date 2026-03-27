import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Trash2, Edit2, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import supabase from '../lib/supabase';

interface Accessory {
  id: number;
  project_id: number;
  name: string;
  category: string;
  unit: string;
  unit_price: number;
  quantity: number;
  notes?: string;
  sort_order: number;
}

const CATEGORIES = ['تركيب', 'رفوف', 'لوحات', 'تشطيب', 'عمالة', 'أخرى'];
const UNITS = ['حبة', 'زوج', 'علبة', 'متر', 'لوح', 'وحدة', 'كج'];

const EMPTY_ACC: Omit<Accessory, 'id' | 'sort_order'> = {
  project_id: 0,
  name: '',
  category: 'تركيب',
  unit: 'حبة',
  unit_price: 0,
  quantity: 0,
  notes: '',
};

export default function AccessoriesPage({ onMenuToggle, projectName }: { onMenuToggle: () => void; projectName: string }) {
  const { projectId } = useParams();
  const [items, setItems] = useState<Accessory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Accessory | null>(null);
  const [form, setForm] = useState({ ...EMPTY_ACC });
  const [saving, setSaving] = useState(false);
  const [filterCat, setFilterCat] = useState('الكل');

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('accessories_prices')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      setItems(data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, [projectId]);

  const openCreate = () => {
    setEditItem(null);
    setForm({ ...EMPTY_ACC, project_id: Number(projectId) });
    setShowModal(true);
  };

  const openEdit = (a: Accessory) => {
    setEditItem(a);
    setForm({ ...a });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editItem) {
        const { error } = await supabase
          .from('accessories_prices')
          .update(form)
          .eq('id', editItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('accessories_prices')
          .insert({ ...form, sort_order: items.length });
        if (error) throw error;
      }
      setShowModal(false);
      fetchItems();
    } catch (err) {
      console.error(err);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('حذف هذا العنصر؟')) return;
    try {
      const { error } = await supabase
        .from('accessories_prices')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchItems();
    } catch (err) {
      console.error(err);
    }
  };

  const handleQtyChange = async (item: Accessory, qty: number) => {
    try {
      const { error } = await supabase
        .from('accessories_prices')
        .update({ quantity: qty })
        .eq('id', item.id);
      if (error) throw error;
      fetchItems();
    } catch (err) {
      console.error(err);
    }
  };

  const cats = ['الكل', ...Array.from(new Set(items.map(i => i.category)))];
  const filtered = filterCat === 'الكل' ? items : items.filter(i => i.category === filterCat);
  const totalCost = items.reduce((s, i) => s + (Number(i.unit_price) * Number(i.quantity)), 0);

  return (
    <div className="page">
      <Header
        title="أسعار الأكسسوار"
        subtitle={`مشروع: ${projectName}`}
        onMenuToggle={onMenuToggle}
        actions={
          <button className="btn-primary" onClick={openCreate}>
            <Plus size={16} /><span>إضافة عنصر</span>
          </button>
        }
      />
      <div className="page-content">
        {loading ? <LoadingSpinner /> : (
          <>
            <div className="acc-summary-bar">
              <div className="acc-summary-item">
                <span>إجمالي تكلفة الأكسسوار:</span>
                <strong>{totalCost.toLocaleString('ar-EG')} ج.م</strong>
              </div>
              <div className="acc-summary-item">
                <span>عدد البنود:</span>
                <strong>{items.length}</strong>
              </div>
            </div>

            <div className="filter-bar">
              {cats.map(c => (
                <button key={c} className={`filter-btn ${filterCat === c ? 'active' : ''}`} onClick={() => setFilterCat(c)}>{c}</button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="empty-state">
                <Package size={56} className="empty-icon" />
                <h3>لا توجد عناصر</h3>
                <button className="btn-primary" onClick={openCreate}><Plus size={16} /><span>إضافة عنصر</span></button>
              </div>
            ) : (
              <div className="acc-table-container">
                <table className="acc-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>العنصر</th>
                      <th>التصنيف</th>
                      <th>الوحدة</th>
                      <th>سعر الوحدة (ج.م)</th>
                      <th>الكمية</th>
                      <th>الإجمالي (ج.م)</th>
                      <th>ملاحظات</th>
                      <th>إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {filtered.map((item, idx) => (
                        <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="acc-row">
                          <td className="unit-num">{idx + 1}</td>
                          <td className="acc-name">{item.name}</td>
                          <td><span className="cat-badge">{item.category}</span></td>
                          <td className="dim-cell">{item.unit}</td>
                          <td className="dim-cell price-cell">{Number(item.unit_price).toLocaleString()}</td>
                          <td>
                            <div className="qty-control">
                              <button onClick={() => handleQtyChange(item, Math.max(0, Number(item.quantity) - 1))}>-</button>
                              <input
                                type="number"
                                min="0"
                                value={item.quantity}
                                onChange={e => handleQtyChange(item, Number(e.target.value))}
                              />
                              <button onClick={() => handleQtyChange(item, Number(item.quantity) + 1)}>+</button>
                            </div>
                          </td>
                          <td className="dim-cell total-cell">
                            {(Number(item.unit_price) * Number(item.quantity)).toLocaleString()}
                          </td>
                          <td className="notes-cell">{item.notes || '-'}</td>
                          <td>
                            <div className="row-actions">
                              <button className="icon-btn-sm" onClick={() => openEdit(item)}><Edit2 size={14} /></button>
                              <button className="icon-btn-sm danger" onClick={() => handleDelete(item.id)}><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                  <tfoot>
                    <tr className="acc-total-row">
                      <td colSpan={6}><strong>الإجمالي</strong></td>
                      <td><strong>{totalCost.toLocaleString('ar-EG')} ج.م</strong></td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)}>
            <motion.div className="modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <h2>{editItem ? 'تعديل العنصر' : 'إضافة عنصر جديد'}</h2>
              <div className="form-group">
                <label>اسم العنصر *</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="مثال: مفصلة كاملة" />
              </div>
              <div className="dims-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group">
                  <label>التصنيف</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="form-select">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>وحدة القياس</label>
                  <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className="form-select">
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>سعر الوحدة (ج.م)</label>
                <input type="number" value={form.unit_price} onChange={e => setForm({ ...form, unit_price: Number(e.target.value) })} />
              </div>
              <div className="form-group">
                <label>الكمية الافتراضية</label>
                <input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} />
              </div>
              <div className="form-group">
                <label>ملاحظات</label>
                <textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="ملاحظات..." />
              </div>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setShowModal(false)}>إلغاء</button>
                <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'جاري...' : (editItem ? 'حفظ' : 'إضافة')}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
