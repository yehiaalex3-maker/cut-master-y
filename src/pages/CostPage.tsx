import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { DollarSign, TrendingUp, Layers, Package, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import type { Unit, CuttingSettings } from '../types';
import { calculateCutList, DEFAULT_CUTTING_SETTINGS } from '../lib/calculations';

interface Board {
  id: number;
  board_name: string;
  code: string;
  width: number;
  height: number;
  price_per_board: number;
  cutting_cost_per_cut: number;
  edge_tape_cost_per_meter: number;
}

interface Accessory {
  id: number;
  name: string;
  category: string;
  unit: string;
  unit_price: number;
  quantity: number;
}

export default function CostPage({ onMenuToggle, projectName }: { onMenuToggle: () => void; projectName: string }) {
  const { projectId } = useParams();
  const [units, setUnits] = useState<Unit[]>([]);
  const [settings, setSettings] = useState<CuttingSettings>(DEFAULT_CUTTING_SETTINGS);
  const [boards, setBoards] = useState<Board[]>([]);
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    boards: true, accessories: true, units: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [unitsRes, settingsRes, boardsRes, accRes] = await Promise.all([
          fetch(`/api/units?project_id=${projectId}`),
          fetch(`/api/settings?project_id=${projectId}`),
          fetch(`/api/boards?project_id=${projectId}`),
          fetch(`/api/accessories?project_id=${projectId}`),
        ]);
        const [unitsData, settingsData, boardsData, accData] = await Promise.all([
          unitsRes.json(), settingsRes.json(), boardsRes.json(), accRes.json(),
        ]);
        setUnits(Array.isArray(unitsData) ? unitsData : []);
        if (settingsData) setSettings({ ...DEFAULT_CUTTING_SETTINGS, ...settingsData });
        setBoards(Array.isArray(boardsData) ? boardsData : []);
        setAccessories(Array.isArray(accData) ? accData : []);
      } finally { setLoading(false); }
    };
    fetchData();
  }, [projectId]);

  if (loading) return <div className="page"><LoadingSpinner /></div>;

  const pieces = calculateCutList(units, settings);
  const totalPieces = pieces.reduce((s, p) => s + p.quantity, 0);

  // Board-based cost calculation
  const boardCosts = boards.map(board => {
    const boardPieces = pieces.filter(p => {
      const code = p.code.toLowerCase();
      const bcode = board.code.toLowerCase();
      return code === bcode || p.material.includes(board.code);
    });
    const totalArea = boardPieces.reduce((s, p) => s + (p.width * p.height * p.quantity) / 10000, 0);
    const boardArea = (Number(board.width) * Number(board.height)) / 10000;
    const numBoards = boardArea > 0 ? Math.ceil(totalArea / boardArea) : 0;
    const boardsCost = numBoards * Number(board.price_per_board);
    const cuttingCost = boardPieces.reduce((s, p) => s + p.quantity, 0) * Number(board.cutting_cost_per_cut);
    const edgeTapeMeters = boardPieces.reduce((s, p) => {
      const edges = [p.edge_front, p.edge_back, p.edge_left, p.edge_right].filter(Boolean).length;
      const perimeter = ((p.width + p.height) * 2 * edges) / 100;
      return s + perimeter * p.quantity;
    }, 0);
    const edgeCost = edgeTapeMeters * Number(board.edge_tape_cost_per_meter);
    return {
      board,
      totalArea,
      numBoards,
      boardsCost,
      cuttingCost,
      edgeTapeMeters,
      edgeCost,
      piecesCount: boardPieces.reduce((s, p) => s + p.quantity, 0),
      total: boardsCost + cuttingCost + edgeCost,
    };
  });

  // Fallback: if no boards configured, use settings prices
  const fallbackWoodArea = pieces.filter(p => p.material === 'خشب').reduce((s, p) => s + (p.width * p.height * p.quantity) / 10000, 0);
  const fallbackDoorArea = pieces.filter(p => p.material === 'ضلفة').reduce((s, p) => s + (p.width * p.height * p.quantity) / 10000, 0);
  const fallbackGlassArea = pieces.filter(p => p.material === 'زجاج').reduce((s, p) => s + (p.width * p.height * p.quantity) / 10000, 0);
  const fallbackWoodCost = (fallbackWoodArea + fallbackDoorArea) * settings.wood_price;
  const fallbackGlassCost = fallbackGlassArea * settings.glass_price;

  const totalBoardsCost = boardCosts.reduce((s, b) => s + b.total, 0);
  const totalAccCost = accessories.reduce((s, a) => s + Number(a.unit_price) * Number(a.quantity), 0);
  const totalCost = (boards.length > 0 ? totalBoardsCost : fallbackWoodCost + fallbackGlassCost) + totalAccCost;

  const formatMoney = (n: number) => n.toLocaleString('ar-EG', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const toggle = (key: string) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  const accByCategory = accessories.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, Accessory[]>);

  return (
    <div className="page">
      <Header title="تكلفة المشروع" subtitle={`مشروع: ${projectName}`} onMenuToggle={onMenuToggle} />
      <div className="page-content">
        {units.length === 0 ? (
          <div className="empty-state">
            <DollarSign size={64} className="empty-icon" />
            <h3>لا توجد بيانات</h3>
            <p>أضف وحدات وإعدادات التقطيع لحساب التكلفة</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="cost-summary-grid">
              <motion.div className="cost-card total" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                <div className="cost-card-icon"><TrendingUp size={28} /></div>
                <div className="cost-card-content">
                  <span className="cost-card-label">إجمالي التكلفة</span>
                  <span className="cost-card-value">{formatMoney(totalCost)} ج.م</span>
                </div>
              </motion.div>
              <motion.div className="cost-card wood" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
                <div className="cost-card-icon"><Layers size={28} /></div>
                <div className="cost-card-content">
                  <span className="cost-card-label">تكلفة الألواح</span>
                  <span className="cost-card-value">{formatMoney(boards.length > 0 ? totalBoardsCost : fallbackWoodCost + fallbackGlassCost)} ج.م</span>
                </div>
              </motion.div>
              <motion.div className="cost-card glass" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
                <div className="cost-card-icon"><Package size={28} /></div>
                <div className="cost-card-content">
                  <span className="cost-card-label">تكلفة الأكسسوار</span>
                  <span className="cost-card-value">{formatMoney(totalAccCost)} ج.م</span>
                </div>
              </motion.div>
              <motion.div className="cost-card units" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
                <div className="cost-card-icon"><Package size={28} /></div>
                <div className="cost-card-content">
                  <span className="cost-card-label">إجمالي القطع</span>
                  <span className="cost-card-value">{totalPieces} قطعة</span>
                </div>
              </motion.div>
            </div>

            {/* Boards Detail */}
            {boards.length > 0 && (
              <div className="cost-breakdown">
                <div className="breakdown-header" onClick={() => toggle('boards')}>
                  <h3><Layers size={16} /> تفصيل تكلفة الألواح</h3>
                  {expandedSections.boards ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
                {expandedSections.boards && (
                  <table className="cost-table">
                    <thead>
                      <tr>
                        <th>اسم الخامة</th>
                        <th>الكود</th>
                        <th>المساحة (م²)</th>
                        <th>عدد الألواح</th>
                        <th>تكلفة الألواح</th>
                        <th>تكلفة التقطيع</th>
                        <th>شريط التشطيب</th>
                        <th>الإجمالي (ج.م)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {boardCosts.map(bc => (
                        <tr key={bc.board.id}>
                          <td>{bc.board.board_name}</td>
                          <td><span className="code-tag">{bc.board.code}</span></td>
                          <td>{bc.totalArea.toFixed(2)}</td>
                          <td>{bc.numBoards} لوح</td>
                          <td>{formatMoney(bc.boardsCost)}</td>
                          <td>{formatMoney(bc.cuttingCost)} ({bc.piecesCount} قطعة)</td>
                          <td>{bc.edgeTapeMeters.toFixed(1)} م → {formatMoney(bc.edgeCost)}</td>
                          <td className="price-cell"><strong>{formatMoney(bc.total)}</strong></td>
                        </tr>
                      ))}
                      <tr className="total-row">
                        <td colSpan={7}><strong>إجمالي تكلفة الألواح</strong></td>
                        <td><strong>{formatMoney(totalBoardsCost)} ج.م</strong></td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Fallback if no boards */}
            {boards.length === 0 && (
              <div className="cost-breakdown">
                <div className="breakdown-header" onClick={() => toggle('boards')}>
                  <h3><Layers size={16} /> تفصيل المواد (بناءً على إعدادات التقطيع)</h3>
                  {expandedSections.boards ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
                {expandedSections.boards && (
                  <table className="cost-table">
                    <thead>
                      <tr><th>البند</th><th>المساحة (م²)</th><th>السعر (ج.م/م²)</th><th>التكلفة (ج.م)</th></tr>
                    </thead>
                    <tbody>
                      <tr><td>خشب الشاسية</td><td>{fallbackWoodArea.toFixed(2)}</td><td>{settings.wood_price}</td><td>{formatMoney(fallbackWoodArea * settings.wood_price)}</td></tr>
                      <tr><td>الضلف والأبواب</td><td>{fallbackDoorArea.toFixed(2)}</td><td>{settings.wood_price}</td><td>{formatMoney(fallbackDoorArea * settings.wood_price)}</td></tr>
                      {fallbackGlassArea > 0 && <tr><td>الزجاج</td><td>{fallbackGlassArea.toFixed(2)}</td><td>{settings.glass_price}</td><td>{formatMoney(fallbackGlassCost)}</td></tr>}
                      <tr className="total-row"><td colSpan={3}><strong>الإجمالي</strong></td><td><strong>{formatMoney(fallbackWoodCost + fallbackGlassCost)} ج.م</strong></td></tr>
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Accessories Detail */}
            <div className="cost-breakdown">
              <div className="breakdown-header" onClick={() => toggle('accessories')}>
                <h3><Package size={16} /> تفصيل تكلفة الأكسسوار</h3>
                {expandedSections.accessories ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
              {expandedSections.accessories && (
                accessories.length === 0 ? (
                  <p className="no-data-msg">لم يتم إضافة أكسسوار بعد. اذهب لصفحة أسعار الأكسسوار لإضافتها.</p>
                ) : (
                  <>
                    {Object.entries(accByCategory).map(([cat, catItems]) => (
                      <div key={cat}>
                        <div className="acc-cat-header">{cat}</div>
                        <table className="cost-table">
                          <thead>
                            <tr><th>العنصر</th><th>الوحدة</th><th>السعر</th><th>الكمية</th><th>الإجمالي (ج.م)</th></tr>
                          </thead>
                          <tbody>
                            {catItems.map(item => (
                              <tr key={item.id}>
                                <td>{item.name}</td>
                                <td>{item.unit}</td>
                                <td>{Number(item.unit_price).toLocaleString()}</td>
                                <td>{Number(item.quantity)}</td>
                                <td className="price-cell">{(Number(item.unit_price) * Number(item.quantity)).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                    <table className="cost-table">
                      <tbody>
                        <tr className="total-row">
                          <td colSpan={4}><strong>إجمالي تكلفة الأكسسوار</strong></td>
                          <td><strong>{formatMoney(totalAccCost)} ج.م</strong></td>
                        </tr>
                      </tbody>
                    </table>
                  </>
                )
              )}
            </div>

            {/* Units Breakdown */}
            <div className="cost-breakdown">
              <div className="breakdown-header" onClick={() => toggle('units')}>
                <h3><Package size={16} /> تفصيل الوحدات</h3>
                {expandedSections.units ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
              {expandedSections.units && (
                <table className="cost-table">
                  <thead>
                    <tr><th>#</th><th>نوع الوحدة</th><th>الكمية</th><th>الأبعاد (عرض × ارتفاع × عمق)</th><th>المساحة التقريبية (م²)</th></tr>
                  </thead>
                  <tbody>
                    {units.map((u, i) => {
                      const area = (u.width * u.height * u.quantity) / 10000;
                      return (
                        <tr key={u.id}>
                          <td>{i + 1}</td>
                          <td>{u.unit_type}</td>
                          <td>{u.quantity}</td>
                          <td>{u.width} × {u.height} × {u.depth} سم</td>
                          <td>{area.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Grand Total */}
            <div className="grand-total-card">
              <div className="grand-total-row">
                <span>تكلفة الألواح والتقطيع</span>
                <strong>{formatMoney(boards.length > 0 ? totalBoardsCost : fallbackWoodCost + fallbackGlassCost)} ج.م</strong>
              </div>
              <div className="grand-total-row">
                <span>تكلفة الأكسسوار</span>
                <strong>{formatMoney(totalAccCost)} ج.م</strong>
              </div>
              <div className="grand-total-row total">
                <span>إجمالي تكلفة المشروع</span>
                <strong>{formatMoney(totalCost)} ج.م</strong>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
