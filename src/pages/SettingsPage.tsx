import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Save, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import supabase from '../lib/supabase';
import type { CuttingSettings } from '../types';
import { DEFAULT_CUTTING_SETTINGS } from '../lib/calculations';

const ASSEMBLY_SYSTEMS = [
  'جانبين كاملين (ظهور مفحار)',
  'جانبين كاملين (ظهور لا مفحار)',
  'جانب واحد مفحار',
  'بدون مفحار',
];

const HANDLE_TYPES = [
  'مقبض بيلت ان',
  'مقبض خارجي',
  'بدون مقبض',
  'مقبض جرح',
];

export default function SettingsPage({ onMenuToggle }: { onMenuToggle: () => void; projectName: string }) {
  const { projectId } = useParams();
  const [settings, setSettings] = useState<CuttingSettings>({ ...DEFAULT_CUTTING_SETTINGS, project_id: Number(projectId) });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await supabase
          .from('cutting_settings')
          .select('*')
          .eq('project_id', projectId)
          .single();
        
        if (data) setSettings({ ...DEFAULT_CUTTING_SETTINGS, ...data });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [projectId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('cutting_settings')
        .upsert({ ...settings, project_id: Number(projectId) }, { onConflict: 'project_id' });
      
      if (error) throw error;
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const set = (key: keyof CuttingSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) return <div className="page"><LoadingSpinner /></div>;

  return (
    <div className="page">
      <Header
        title="إعدادات التقطيع"
        subtitle="تخصيص طريقة الحساب والهدر وأسعار الخامات"
        onMenuToggle={onMenuToggle}
        actions={
          <button className={`btn-primary ${saved ? 'saved' : ''}`} onClick={handleSave} disabled={saving}>
            <Save size={16} />
            <span>{saved ? 'تم الحفظ ✓' : saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}</span>
          </button>
        }
      />

      <div className="page-content">
        <div className="settings-grid">
          {/* Assembly Method */}
          <motion.div className="settings-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="settings-card-header">
              <div className="settings-card-title">
                <h3>طريقة التجميع</h3>
                <p>تحديد كيفية تجميع الوحدات والمقابض</p>
              </div>
              <div className="settings-card-header-icon"><Settings size={18} /></div>
            </div>
            <div className="settings-fields">
              <div className="form-group">
                <label>نظام التجميع</label>
                <select value={settings.assembly_system} onChange={e => set('assembly_system', e.target.value)} className="form-select">
                  {ASSEMBLY_SYSTEMS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>نوع المقبض</label>
                <select value={settings.handle_type} onChange={e => set('handle_type', e.target.value)} className="form-select">
                  {HANDLE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="settings-row">
                <div className="form-group">
                  <label>ارتفاع قطاع المقبض - C/L</label>
                  <div className="input-with-unit">
                    <input type="number" value={settings.hinge_height} onChange={e => set('hinge_height', Number(e.target.value))} />
                    <span>سم</span>
                  </div>
                </div>
                <div className="form-group">
                  <label>سقوط الضلفة - قطاع الشاسيه</label>
                  <div className="input-with-unit">
                    <input type="number" value={settings.hinge_drop} onChange={e => set('hinge_drop', Number(e.target.value))} />
                    <span>سم</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Dimensions & Deductions */}
          <motion.div className="settings-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="settings-card-header">
              <div className="settings-card-title">
                <h3>الأبعاد والخصومات</h3>
                <p>تحديد سمك الخامات وقيم الخصم المختلفة</p>
              </div>
              <div className="settings-card-header-icon"><Settings size={18} /></div>
            </div>
            <div className="settings-fields">
              <div className="settings-row">
                <div className="form-group">
                  <label>سمك الكونتر</label>
                  <div className="input-with-unit">
                    <input type="number" value={settings.counter_thickness} onChange={e => set('counter_thickness', Number(e.target.value))} />
                    <span>سم</span>
                  </div>
                </div>
                <div className="form-group">
                  <label>عرض المرآة</label>
                  <div className="input-with-unit">
                    <input type="number" value={settings.mirror_width} onChange={e => set('mirror_width', Number(e.target.value))} />
                    <span>سم</span>
                  </div>
                </div>
              </div>
              <div className="settings-row">
                <div className="form-group">
                  <label>خصم الظهر</label>
                  <div className="input-with-unit">
                    <input type="number" value={settings.back_deduction} onChange={e => set('back_deduction', Number(e.target.value))} />
                    <span>سم</span>
                  </div>
                </div>
                <div className="form-group">
                  <label>خصم الرف من العمق</label>
                  <div className="input-with-unit">
                    <input type="number" value={settings.depth_deduction} onChange={e => set('depth_deduction', Number(e.target.value))} />
                    <span>سم</span>
                  </div>
                </div>
              </div>
              <div className="settings-row">
                <div className="form-group">
                  <label>خصم عرض الضلفة</label>
                  <div className="input-with-unit">
                    <input type="number" value={settings.door_width_deduction} onChange={e => set('door_width_deduction', Number(e.target.value))} />
                    <span>سم</span>
                  </div>
                </div>
                <div className="form-group">
                  <label>خصم ارتفاع ضلفة أرضي</label>
                  <div className="input-with-unit">
                    <input type="number" value={settings.door_height_deduction_ground} onChange={e => set('door_height_deduction_ground', Number(e.target.value))} />
                    <span>سم</span>
                  </div>
                </div>
              </div>
              <div className="settings-row">
                <div className="form-group">
                  <label>سعر لوح الخشب (الكونتر)</label>
                  <div className="input-with-unit">
                    <input type="number" value={settings.wood_price} onChange={e => set('wood_price', Number(e.target.value))} />
                    <span>ج.م</span>
                  </div>
                </div>
                <div className="form-group">
                  <label>سعر متر الزجاج</label>
                  <div className="input-with-unit">
                    <input type="number" value={settings.glass_price} onChange={e => set('glass_price', Number(e.target.value))} />
                    <span>ج.م</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Cutting Codes */}
          <motion.div className="settings-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="settings-card-header">
              <div className="settings-card-title">
                <h3>أكواد التقطيع</h3>
                <p>تخصيص الرموز المستخدمة في تقارير القص (3 أكواد موحدة للضلف والشاسيه)</p>
              </div>
              <div className="settings-card-header-icon"><Settings size={18} /></div>
            </div>
            <div className="settings-fields">
              <div className="settings-row three">
                <div className="form-group">
                  <label>كود أساسي</label>
                  <input type="text" value={settings.basic_code} onChange={e => set('basic_code', e.target.value)} className="form-input" placeholder="Basic" />
                </div>
                <div className="form-group">
                  <label>كود إضافي 1</label>
                  <input type="text" value={settings.extra_code1} onChange={e => set('extra_code1', e.target.value)} className="form-input" placeholder="Add1" />
                </div>
                <div className="form-group">
                  <label>كود إضافي 2</label>
                  <input type="text" value={settings.extra_code2} onChange={e => set('extra_code2', e.target.value)} className="form-input" placeholder="Add2" />
                </div>
              </div>
              <div className="settings-row">
                <div className="form-group">
                  <label>كود شريط أمامي أساسي</label>
                  <input type="text" value={settings.front_tape_basic} onChange={e => set('front_tape_basic', e.target.value)} className="form-input" placeholder="مثال: أبيض" />
                </div>
                <div className="form-group">
                  <label>كود شريط أمامي إضافي</label>
                  <input type="text" value={settings.front_tape_extra} onChange={e => set('front_tape_extra', e.target.value)} className="form-input" placeholder="مثال: بيج" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Drawer Settings */}
          <motion.div className="settings-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="settings-card-header">
              <div className="settings-card-title">
                <h3>إعدادات المفحار</h3>
                <p>تحديد أبعاد ومسافات المفحار</p>
              </div>
              <div className="settings-card-header-icon"><Settings size={18} /></div>
            </div>
            <div className="settings-fields">
              <div className="settings-row three">
                <div className="form-group">
                  <label>عمق المفحار</label>
                  <div className="input-with-unit">
                    <input type="number" value={settings.drawer_depth} onChange={e => set('drawer_depth', Number(e.target.value))} />
                    <span>سم</span>
                  </div>
                </div>
                <div className="form-group">
                  <label>بعد المفحار</label>
                  <div className="input-with-unit">
                    <input type="number" value={settings.drawer_height} onChange={e => set('drawer_height', Number(e.target.value))} />
                    <span>سم</span>
                  </div>
                </div>
                <div className="form-group">
                  <label>سمك المفحار</label>
                  <div className="input-with-unit">
                    <input type="number" value={settings.drawer_thickness} onChange={e => set('drawer_thickness', Number(e.target.value))} />
                    <span>سم</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Handle Cut Settings */}
          <motion.div className="settings-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <div className="settings-card-header">
              <div className="settings-card-title">
                <h3>أبعاد الشريط والوحدة</h3>
                <p>إعدادات قطع الشريط والمقابض</p>
              </div>
              <div className="settings-card-header-icon"><Settings size={18} /></div>
            </div>
            <div className="settings-fields">
              <div className="settings-row">
                <div className="form-group">
                  <label>عرض قطع المقبض</label>
                  <div className="input-with-unit">
                    <input type="number" value={settings.handle_cut_width} onChange={e => set('handle_cut_width', Number(e.target.value))} />
                    <span>سم</span>
                  </div>
                </div>
                <div className="form-group">
                  <label>عمق قطع المقبض</label>
                  <div className="input-with-unit">
                    <input type="number" value={settings.handle_cut_depth} onChange={e => set('handle_cut_depth', Number(e.target.value))} />
                    <span>سم</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
