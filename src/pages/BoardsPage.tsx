import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Trash2, Edit2, Layers, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import supabase from '../lib/supabase';

interface Board {
  id: number;
  project_id: number;
  board_name: string;
  code: string;
  width: number;
  height: number;
  thickness: number;
  price_per_board: number;
  cutting_cost_per_cut: number;
  edge_tape_cost_per_meter: number;
  notes?: string;
  sort_order: number;
}

const EMPTY_BOARD: Omit<Board, 'id' | 'sort_order'> = {
  project_id: 0,
  board_name: '',
  code: 'Basic',
  width: 244,
  height: 122,
  thickness: 1.8,
  price_per_board: 0,
  cutting_cost_per_cut: 5,
  edge_tape_cost_per_meter: 3,
  notes: '',
};

export default function BoardsPage({ onMenuToggle, projectName }: { onMenuToggle: () => void; projectName: string }) {
  const { projectId } = useParams();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editBoard, setEditBoard] = useState<Board | null>(null);
  const [form, setForm] = useState({ ...EMPTY_BOARD });
  const [saving, setSaving] = useState(false);

  const fetchBoards = async () => {
    try {
      const { data, error } = await supabase
        .from('boards_settings')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      setBoards(data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBoards(); }, [projectId]);

  const openCreate = () => {
    setEditBoard(null);
    setForm({ ...EMPTY_BOARD, project_id: Number(projectId) });
    setShowModal(true);
  };

  const openEdit = (b: Board) => {
    setEditBoard(b);
    setForm({ ...b });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.board_name.trim()) return;
    setSaving(true);
    try {
      if (editBoard) {
        const { error } = await supabase
          .from('boards_settings')
          .update(form)
          .eq('id', editBoard.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('boards_settings')
          .insert({ ...form, sort_order: boards.length });
        if (error) throw error;
      }
      setShowModal(false);
      fetchBoards();
    } catch (err) {
      console.error(err);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('حذف هذا اللوح؟')) return;
    try {
      const { error } = await supabase
        .from('boards_settings')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchBoards();
    } catch (err) {
      console.error(err);
    }
  };

  const f = (v: any) => (typeof v === 'number' ? v : Number(v) || 0);

  return (
    <div className="page">
      <Header
        title="إعدادات الألواح"
        subtitle={`مشروع: ${projectName}`}
        onMenuToggle={onMenuToggle}
        actions={
          <button className="btn-primary" onClick={openCreate}>
            <Plus size={16} /><span>إضافة لوح</span>
          </button>
        }
      />
      <div className="page-content">
        {loading ? <LoadingSpinner /> : boards.length === 0 ? (
          <div className="empty-state">
            <Layers size={56} className="empty-icon" />
            <h3>لا توجد ألواح محددة</h3>
            <p>أضف ألواح الخشب مع مقاساتها وأسعارها لحساب التكلفة بدقة</p>
            <button className="btn-primary" onClick={openCreate}><Plus size={16} /><span>إضافة لوح</span></button>
          </div>
        ) : (
          <div className="boards-grid">
            {boards.map((board, idx) => {
              const boardArea = (f(board.width) * f(board.height)) / 10000;
              const pricePerM2 = boardArea > 0 ? f(board.price_per_board) / boardArea : 0;
              return (
                <motion.div key={board.id} className="board-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                  <div className="board-card-header">
                    <div className="board-code-badge">{board.code}</div>
                    <div className="board-actions">
                      <button className="icon-btn-sm" onClick={() => openEdit(board)}><Edit2 size={14} /></button>
                      <button className="icon-btn-sm danger" onClick={() => handleDelete(board.id)}><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <h3 className="board-name">{board.board_name}</h3>
                  <div className="board-specs">
                    <div className="board-spec">
                      <span className="spec-label">المقاس</span>
                      <span className="spec-val">{f(board.width)} × {f(board.height)} سم</span>
                    </div>
                    <div className="board-spec">
                      <span className="spec-label">السمك</span>
                      <span className="spec-val">{f(board.thickness)} سم</span>
                    </div>
                    <div className="board-spec">
                      <span className="spec-label">سعر اللوح</span>
                      <span className="spec-val price">{f(board.price_per_board).toLocaleString()} ج.م</span>
                    </div>
                    <div className="board-spec">
                      <span className="spec-label">سعر المتر²</span>
                      <span className="spec-val">{pricePerM2.toFixed(0)} ج.م</span>
                    </div>
                    <div className="board-spec">
                      <span className="spec-label">تكلفة القطعة</span>
                      <span className="spec-val">{f(board.cutting_cost_per_cut)} ج.م</span>
                    </div>
                    <div className="board-spec">
                      <span className="spec-label">شريط المتر</span>
                      <span className="spec-val">{f(board.edge_tape_cost_per_meter)} ج.م</span>
                    </div>
                  </div>
                  {board.notes && <p className="board-notes"><Info size={12} />{board.notes}</p>}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)}>
            <motion.div className="modal modal-large" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editBoard ? 'تعديل بيانات اللوح' : 'إضافة لوح جديد'}</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="form-section">
                  <div className="dims-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <div className="form-group">
                      <label>اسم اللوح *</label>
                      <input type="text" value={form.board_name} onChange={e => setForm({ ...form, board_name: e.target.value })} className="form-input" placeholder="مثال: MDF أبيض 18مم" />
                    </div>
                    <div className="form-group">
                      <label>كود الخامة</label>
                      <input type="text" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} className="form-input" placeholder="Basic / Add1 / Add2 / Glass" />
                    </div>
                  </div>
                </div>
                <div className="form-section">
                  <label className="section-label">مقاسات اللوح</label>
                  <div className="dims-grid">
                    <div className="form-group">
                      <label>العرض (سم)</label>
                      <input type="number" value={form.width} onChange={e => setForm({ ...form, width: Number(e.target.value) })} className="form-input" />
                    </div>
                    <div className="form-group">
                      <label>الارتفاع (سم)</label>
                      <input type="number" value={form.height} onChange={e => setForm({ ...form, height: Number(e.target.value) })} className="form-input" />
                    </div>
                    <div className="form-group">
                      <label>السمك (سم)</label>
                      <input type="number" step="0.1" value={form.thickness} onChange={e => setForm({ ...form, thickness: Number(e.target.value) })} className="form-input" />
                    </div>
                  </div>
                </div>
                <div className="form-section">
                  <label className="section-label">الأسعار</label>
                  <div className="dims-grid">
                    <div className="form-group">
                      <label>سعر اللوح (ج.م)</label>
                      <input type="number" value={form.price_per_board} onChange={e => setForm({ ...form, price_per_board: Number(e.target.value) })} className="form-input" />
                    </div>
                    <div className="form-group">
                      <label>تكلفة القطعة (ج.م)</label>
                      <input type="number" step="0.5" value={form.cutting_cost_per_cut} onChange={e => setForm({ ...form, cutting_cost_per_cut: Number(e.target.value) })} className="form-input" />
                    </div>
                    <div className="form-group">
                      <label>شريط التشطيب (ج.م/م)</label>
                      <input type="number" step="0.5" value={form.edge_tape_cost_per_meter} onChange={e => setForm({ ...form, edge_tape_cost_per_meter: Number(e.target.value) })} className="form-input" />
                    </div>
                  </div>
                </div>
                <div className="form-section">
                  <div className="form-group">
                    <label>ملاحظات</label>
                    <textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} className="form-textarea" rows={2} placeholder="ملاحظات إضافية..." />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setShowModal(false)}>إلغاء</button>
                <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'جاري...' : (editBoard ? 'حفظ' : 'إضافة')}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
