export interface Project {
  id: number;
  user_id?: string;
  group_id?: number | null;
  name: string;
  client_name?: string;
  notes?: string;
  created_at: string;
}

export type UnitCategory = 'ارضي' | 'دواليب' | 'علوي' | 'ديكور';

export type UnitType =
  | 'خزانة سفلية'
  | 'وحدة حوض'
  | 'ارضي ثابت'
  | 'حوض ثابت'
  | 'ادراج'
  | 'ادراج م سفلية'
  | 'ركنه ل ارضي'
  | 'وحدة م جرح جانبية + ضلف'
  | 'وحدة م جرح م سفلية + ضلف'
  | 'دولاب عادي'
  | 'دولاب ادراج'
  | 'دولاب كورنر'
  | 'خزانة علوية'
  | 'خزانة علوية ادراج'
  | 'ركنه علوية'
  | 'خزانة فوق الثلاجة'
  | 'ديكور جانبي'
  | 'ديكور علوي'
  | 'رف ديكور';

export interface Unit {
  id: number;
  project_id: number;
  unit_type: string;
  unit_category: string;
  quantity: number;
  width: number;
  height: number;
  depth: number;
  shelves_count: number;
  drawers_count: number;
  door_code_type: string;
  chassis_code_type: string;
  dummy_side: string;
  front_tape_color: string;
  has_glass_door: boolean;
  has_glass_shelf: boolean;
  notes?: string;
  sort_order: number;
  created_at: string;
}

export interface CuttingSettings {
  id?: number;
  project_id: number;
  assembly_system: string;
  handle_type: string;
  counter_thickness: number;
  mirror_width: number;
  back_deduction: number;
  depth_deduction: number;
  door_width_deduction: number;
  door_height_deduction_ground: number;
  wood_price: number;
  glass_price: number;
  basic_code: string;
  extra_code1: string;
  extra_code2: string;
  front_tape_basic: string;
  front_tape_extra: string;
  hinge_height: number;
  hinge_drop: number;
  drawer_depth: number;
  drawer_height: number;
  drawer_thickness: number;
  handle_cut_width: number;
  handle_cut_depth: number;
}

export interface CutPiece {
  code: string;
  unit_name: string;
  unit_number: number;
  piece_name: string;
  width: number;
  height: number;
  quantity: number;
  material: string;
  edge_front: boolean;
  edge_back: boolean;
  edge_left: boolean;
  edge_right: boolean;
}
