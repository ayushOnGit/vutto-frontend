export interface SettlementConfig {
  id?: number;
  rule_name: string;
  source_type: 'mparivahan' | 'vcourt' | 'delhi_police';
  region: string;
  challan_year_cutoff: number | null;
  year_cutoff_logic: '≤' | '>' | null; // New field for year cutoff logic
  amount_cutoff: number | null;
  amount_cutoff_logic: '≤' | '>' | null; // New field for amount cutoff logic
  settlement_percentage: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SettlementConfigFormData {
  rule_name: string;
  source_type: 'mparivahan' | 'vcourt' | 'delhi_police';
  region: string;
  challan_year_cutoff: string;
  year_cutoff_logic: '≤' | '>' | ''; // New field for year cutoff logic
  amount_cutoff: string;
  amount_cutoff_logic: '≤' | '>' | ''; // New field for amount cutoff logic
  settlement_percentage: string;
  is_active: boolean;
}

export const SOURCE_TYPES = [
  { value: 'mparivahan', label: 'MParivahan (ACKO/CarInfo)' },
  { value: 'vcourt', label: 'VCourt' },
  { value: 'delhi_police', label: 'Delhi Police' }
] as const;

export const REGIONS = [
  { value: 'ALL', label: 'All Regions' },
  { value: 'DL', label: 'Delhi (DL)' },
  { value: 'UP', label: 'Uttar Pradesh (UP)' },
  { value: 'HR', label: 'Haryana (HR)' }
] as const;

export const CUTOFF_LOGIC_OPTIONS = [
  { value: '≤', label: 'Less than or equal to (≤)' },
  { value: '>', label: 'Greater than (>)' }
] as const;

