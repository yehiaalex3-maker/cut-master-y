import type { Unit, CuttingSettings, CutPiece } from '../types';

const DEFAULT_SETTINGS: Partial<CuttingSettings> = {
  counter_thickness: 1.8,
  mirror_width: 8,
  back_deduction: 2,
  depth_deduction: 5,
  door_width_deduction: 0.5,
  door_height_deduction_ground: 0.5,
  wood_price: 1300,
  glass_price: 750,
  hinge_height: 3.5,
  hinge_drop: 1,
  drawer_depth: 1,
  drawer_height: 1.8,
  drawer_thickness: 0.6,
  handle_cut_width: 8,
  handle_cut_depth: 1,
};

function s(settings: CuttingSettings, key: keyof CuttingSettings): number {
  const val = settings[key];
  return typeof val === 'number' ? val : (DEFAULT_SETTINGS[key] as number) || 0;
}

export function calculateCutList(units: Unit[], settings: CuttingSettings): CutPiece[] {
  const pieces: CutPiece[] = [];
  const ct = s(settings, 'counter_thickness'); // سمك الكونتر
  const backDed = s(settings, 'back_deduction'); // خصم الظهر
  const depthDed = s(settings, 'depth_deduction'); // خصم الرف من العمق
  const doorW = s(settings, 'door_width_deduction'); // خصم عرض الضلفة
  const doorH = s(settings, 'door_height_deduction_ground'); // خصم ارتفاع ضلفة ارضي

  units.forEach((unit, idx) => {
    const W = unit.width;
    const H = unit.height;
    const D = unit.depth;
    const qty = unit.quantity;
    const n = idx + 1;
    const code = settings.basic_code || 'Basic';

    const addPiece = (piece_name: string, width: number, height: number, quantity: number, material = 'خشب', edges = { f: false, b: false, l: false, r: false }) => {
      for (let q = 0; q < qty; q++) {
        pieces.push({
          code,
          unit_name: unit.unit_type,
          unit_number: n,
          piece_name,
          width: Math.round(width * 10) / 10,
          height: Math.round(height * 10) / 10,
          quantity,
          material,
          edge_front: edges.f,
          edge_back: edges.b,
          edge_left: edges.l,
          edge_right: edges.r,
        });
      }
    };

    const type = unit.unit_type;

    if (type === 'خزانة سفلية' || type === 'ارضي ثابت') {
      // جانبين
      addPiece('جانب', D - backDed, H, 2, 'خشب', { f: true, b: false, l: true, r: true });
      // ظهر
      addPiece('ظهر', W - ct * 2, H, 1, 'خشب', { f: false, b: false, l: false, r: false });
      // قاعدة
      addPiece('قاعدة', W - ct * 2, D - backDed, 1, 'خشب', { f: true, b: false, l: false, r: false });
      // سقف داخلي
      addPiece('سقف داخلي', W - ct * 2, D - backDed, 1, 'خشب', { f: true, b: false, l: false, r: false });
      // رفوف
      for (let i = 0; i < unit.shelves_count; i++) {
        addPiece(`رف ${i + 1}`, W - ct * 2, D - depthDed - backDed, 1, 'خشب', { f: true, b: false, l: false, r: false });
      }
      // ضلف
      const doorWidth = (W / (unit.drawers_count > 0 ? 2 : 2)) - doorW;
      const doorHeight = H - doorH * 2;
      const numDoors = unit.drawers_count > 0 ? 1 : 2;
      addPiece('ضلفة', doorWidth, doorHeight, numDoors, 'ضلفة', { f: true, b: false, l: true, r: true });
      // ادراج
      for (let i = 0; i < unit.drawers_count; i++) {
        addPiece(`درج أمامي ${i + 1}`, W - doorW * 2, (H / (unit.drawers_count + 1)) - doorH, 1, 'ضلفة', { f: true, b: false, l: false, r: false });
        addPiece(`درج جانب ${i + 1}`, D - backDed - 5, 15, 2, 'خشب', { f: false, b: false, l: false, r: false });
        addPiece(`درج قاعدة ${i + 1}`, W - ct * 2 - 2, D - backDed - 5, 1, 'خشب', { f: false, b: false, l: false, r: false });
        addPiece(`درج ظهر ${i + 1}`, W - ct * 2 - 2, 15, 1, 'خشب', { f: false, b: false, l: false, r: false });
      }
    } else if (type === 'وحدة حوض') {
      addPiece('جانب', D - backDed, H, 2, 'خشب', { f: true, b: false, l: true, r: true });
      addPiece('ظهر', W - ct * 2, H, 1, 'خشب', { f: false, b: false, l: false, r: false });
      addPiece('قاعدة', W - ct * 2, D - backDed, 1, 'خشب', { f: true, b: false, l: false, r: false });
      addPiece('ضلفة يمين', W / 2 - doorW, H - doorH * 2, 1, 'ضلفة', { f: true, b: false, l: true, r: true });
      addPiece('ضلفة يسار', W / 2 - doorW, H - doorH * 2, 1, 'ضلفة', { f: true, b: false, l: true, r: true });
    } else if (type === 'ادراج') {
      addPiece('جانب', D - backDed, H, 2, 'خشب', { f: true, b: false, l: true, r: true });
      addPiece('ظهر', W - ct * 2, H, 1, 'خشب', { f: false, b: false, l: false, r: false });
      addPiece('قاعدة', W - ct * 2, D - backDed, 1, 'خشب', { f: true, b: false, l: false, r: false });
      const drawerH = (H - doorH * 2) / unit.drawers_count;
      for (let i = 0; i < unit.drawers_count; i++) {
        addPiece(`درج أمامي ${i + 1}`, W - doorW * 2, drawerH - 0.5, 1, 'ضلفة', { f: true, b: false, l: false, r: false });
        addPiece(`درج جانب ${i + 1}`, D - backDed - 5, 15, 2, 'خشب');
        addPiece(`درج قاعدة ${i + 1}`, W - ct * 2 - 2, D - backDed - 5, 1, 'خشب');
        addPiece(`درج ظهر ${i + 1}`, W - ct * 2 - 2, 15, 1, 'خشب');
      }
    } else if (type === 'خزانة علوية') {
      addPiece('جانب', D - backDed, H, 2, 'خشب', { f: true, b: false, l: true, r: true });
      addPiece('ظهر', W - ct * 2, H, 1, 'خشب');
      addPiece('قاعدة', W - ct * 2, D - backDed, 1, 'خشب', { f: true, b: false, l: false, r: false });
      addPiece('سقف', W - ct * 2, D - backDed, 1, 'خشب', { f: true, b: false, l: false, r: false });
      for (let i = 0; i < unit.shelves_count; i++) {
        addPiece(`رف ${i + 1}`, W - ct * 2, D - depthDed - backDed, 1, 'خشب', { f: true, b: false, l: false, r: false });
      }
      const numDoors = W > 60 ? 2 : 1;
      addPiece('ضلفة', W / numDoors - doorW, H - doorH * 2, numDoors, 'ضلفة', { f: true, b: false, l: true, r: true });
    } else if (type === 'دولاب عادي') {
      addPiece('جانب', D - backDed, H, 2, 'خشب', { f: true, b: false, l: true, r: true });
      addPiece('ظهر', W - ct * 2, H, 1, 'خشب');
      addPiece('قاعدة', W - ct * 2, D - backDed, 1, 'خشب', { f: true, b: false, l: false, r: false });
      addPiece('سقف', W - ct * 2, D - backDed, 1, 'خشب', { f: true, b: false, l: false, r: false });
      for (let i = 0; i < unit.shelves_count; i++) {
        addPiece(`رف ${i + 1}`, W - ct * 2, D - depthDed - backDed, 1, 'خشب', { f: true, b: false, l: false, r: false });
      }
      const numDoors = W > 60 ? 2 : 1;
      addPiece('ضلفة', W / numDoors - doorW, H - doorH * 2, numDoors, 'ضلفة', { f: true, b: false, l: true, r: true });
    } else if (type === 'دولاب ادراج') {
      addPiece('جانب', D - backDed, H, 2, 'خشب', { f: true, b: false, l: true, r: true });
      addPiece('ظهر', W - ct * 2, H, 1, 'خشب');
      addPiece('قاعدة', W - ct * 2, D - backDed, 1, 'خشب', { f: true, b: false, l: false, r: false });
      addPiece('سقف', W - ct * 2, D - backDed, 1, 'خشب', { f: true, b: false, l: false, r: false });
      const drawerH = (H - doorH * 2) / unit.drawers_count;
      for (let i = 0; i < unit.drawers_count; i++) {
        addPiece(`درج أمامي ${i + 1}`, W - doorW * 2, drawerH - 0.5, 1, 'ضلفة', { f: true, b: false, l: false, r: false });
        addPiece(`درج جانب ${i + 1}`, D - backDed - 5, 20, 2, 'خشب');
        addPiece(`درج قاعدة ${i + 1}`, W - ct * 2 - 2, D - backDed - 5, 1, 'خشب');
        addPiece(`درج ظهر ${i + 1}`, W - ct * 2 - 2, 20, 1, 'خشب');
      }
    } else if (type === 'رف ديكور' || type === 'ديكور علوي') {
      addPiece('رف', W, D, 1, 'خشب', { f: true, b: false, l: true, r: true });
      addPiece('جانب', D, H, 2, 'خشب', { f: true, b: false, l: true, r: true });
    } else {
      // Default generic calculation
      addPiece('جانب', D - backDed, H, 2, 'خشب', { f: true, b: false, l: true, r: true });
      addPiece('ظهر', W - ct * 2, H, 1, 'خشب');
      addPiece('قاعدة', W - ct * 2, D - backDed, 1, 'خشب', { f: true, b: false, l: false, r: false });
      addPiece('سقف', W - ct * 2, D - backDed, 1, 'خشب', { f: true, b: false, l: false, r: false });
      for (let i = 0; i < unit.shelves_count; i++) {
        addPiece(`رف ${i + 1}`, W - ct * 2, D - depthDed - backDed, 1, 'خشب', { f: true, b: false, l: false, r: false });
      }
    }
  });

  return pieces;
}

export function calculateCost(pieces: CutPiece[], settings: CuttingSettings): {
  totalArea: number;
  woodCost: number;
  glassCost: number;
  totalCost: number;
} {
  let woodArea = 0;
  let glassArea = 0;

  pieces.forEach(p => {
    const area = (p.width * p.height * p.quantity) / 10000; // cm² to m²
    if (p.material === 'زجاج') glassArea += area;
    else woodArea += area;
  });

  const woodCost = woodArea * (settings.wood_price || 1300);
  const glassCost = glassArea * (settings.glass_price || 750);

  return {
    totalArea: woodArea + glassArea,
    woodCost,
    glassCost,
    totalCost: woodCost + glassCost,
  };
}

export const DEFAULT_CUTTING_SETTINGS: CuttingSettings = {
  project_id: 0,
  assembly_system: 'جانبين كاملين (ظهور مفحار)',
  handle_type: 'مقبض بيلت ان',
  counter_thickness: 1.8,
  mirror_width: 8,
  back_deduction: 2,
  depth_deduction: 5,
  door_width_deduction: 0.5,
  door_height_deduction_ground: 0.5,
  wood_price: 1300,
  glass_price: 750,
  basic_code: 'Basic',
  extra_code1: 'Add1',
  extra_code2: 'Add2',
  front_tape_basic: '',
  front_tape_extra: '',
  hinge_height: 3.5,
  hinge_drop: 1,
  drawer_depth: 1,
  drawer_height: 1.8,
  drawer_thickness: 0.6,
  handle_cut_width: 8,
  handle_cut_depth: 1,
};
