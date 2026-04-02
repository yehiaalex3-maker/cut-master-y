import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FileSpreadsheet, Filter } from 'lucide-react';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import type { Unit, CuttingSettings, CutPiece } from '../types';
import { calculateCutList, DEFAULT_CUTTING_SETTINGS } from '../lib/calculations';
import supabase from '../lib/supabase';
import { exportProjectToExcel } from '../lib/exportService';

export default function CutListPage({ onMenuToggle, projectName }: { onMenuToggle: () => void; projectName: string }) {
  const { projectId } = useParams();
  const [units, setUnits] = useState<Unit[]>([]);
  const [, setSettings] = useState<CuttingSettings>(DEFAULT_CUTTING_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [filterMaterial, setFilterMaterial] = useState('الكل');
  const [pieces, setPieces] = useState<CutPiece[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [unitsRes, settingsRes] = await Promise.all([
          supabase.from('units').select('*').eq('project_id', projectId).order('sort_order', { ascending: true }),
          supabase.from('cutting_settings').select('*').eq('project_id', projectId).maybeSingle()
        ]);
        const unitsData = unitsRes.data || [];
        const settingsData = settingsRes.data;
        const u = Array.isArray(unitsData) ? unitsData : [];
        const s = settingsData || { ...DEFAULT_CUTTING_SETTINGS, project_id: Number(projectId) };
        setUnits(u);
        setSettings(s);
        setPieces(calculateCutList(u, s));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [projectId]);

  const materials = ['الكل', ...Array.from(new Set(pieces.map(p => p.material)))];
  const filtered = filterMaterial === 'الكل' ? pieces : pieces.filter(p => p.material === filterMaterial);

  const handleExport = () => {
    const exportData = pieces.map(p => ({
      name: `${p.unit_name} - ${p.piece_name}`,
      width: p.width,
      height: p.height,
      quantity: p.quantity
    }));
    exportProjectToExcel(projectName, exportData);
  };

  const totalPieces = filtered.reduce((sum, p) => sum + p.quantity, 0);

  return (
    <div className="page">
      <Header
        title="قائمة القطع"
        subtitle={`مشروع: ${projectName || ''}`}
        onMenuToggle={onMenuToggle}
        actions={
          <button className="btn-primary" onClick={handleExport}>
            <FileSpreadsheet size={16} />
            <span>تصدير Excel</span>
          </button>
        }
      />

      <div className="page-content">
        {loading ? (
          <LoadingSpinner />
        ) : pieces.length === 0 ? (
          <div className="empty-state">
            <span style={{ fontSize: 64 }}>✂️</span>
            <h3>لا توجد قطع بعد</h3>
            <p>أضف وحدات في صفحة تفريغ المقاسات لعرض قائمة القطع</p>
          </div>
        ) : (
          <>
            <div className="cutlist-stats">
              <div className="stat-card">
                <span className="stat-num">{units.length}</span>
                <span className="stat-label">وحدة</span>
              </div>
              <div className="stat-card">
                <span className="stat-num">{pieces.length}</span>
                <span className="stat-label">نوع قطعة</span>
              </div>
              <div className="stat-card">
                <span className="stat-num">{totalPieces}</span>
                <span className="stat-label">قطعة إجمالي</span>
              </div>
            </div>

            <div className="filter-bar">
              <Filter size={16} />
              <span>تصفية حسب الخامة:</span>
              {materials.map(m => (
                <button
                  key={m}
                  className={`filter-btn ${filterMaterial === m ? 'active' : ''}`}
                  onClick={() => setFilterMaterial(m)}
                >
                  {m}
                </button>
              ))}
            </div>

            <div className="cutlist-table-container">
              <table className="cutlist-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>كود</th>
                    <th>الوحدة</th>
                    <th>اسم القطعة</th>
                    <th>العرض (سم)</th>
                    <th>الارتفاع (سم)</th>
                    <th>الكمية</th>
                    <th>الخامة</th>
                    <th>شريط أمامي</th>
                    <th>شريط خلفي</th>
                    <th>شريط يسار</th>
                    <th>شريط يمين</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((piece, idx) => (
                    <tr key={idx} className={`cut-row ${piece.material === 'ضلفة' ? 'door-row' : piece.material === 'زجاج' ? 'glass-row' : ''}`}>
                      <td>{idx + 1}</td>
                      <td><span className="code-tag">{piece.code}</span></td>
                      <td>
                        <div className="unit-ref">
                          <span className="unit-ref-name">{piece.unit_name}</span>
                          <span className="unit-ref-num">#{piece.unit_number}</span>
                        </div>
                      </td>
                      <td className="piece-name">{piece.piece_name}</td>
                      <td className="dim">{piece.width}</td>
                      <td className="dim">{piece.height}</td>
                      <td><span className="qty-tag">{piece.quantity}</span></td>
                      <td>
                        <span className={`material-tag ${piece.material === 'ضلفة' ? 'door' : piece.material === 'زجاج' ? 'glass' : 'wood'}`}>
                          {piece.material}
                        </span>
                      </td>
                      <td className={piece.edge_front ? 'edge-yes' : 'edge-no'}>{piece.edge_front ? '✓' : '-'}</td>
                      <td className={piece.edge_back ? 'edge-yes' : 'edge-no'}>{piece.edge_back ? '✓' : '-'}</td>
                      <td className={piece.edge_left ? 'edge-yes' : 'edge-no'}>{piece.edge_left ? '✓' : '-'}</td>
                      <td className={piece.edge_right ? 'edge-yes' : 'edge-no'}>{piece.edge_right ? '✓' : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
