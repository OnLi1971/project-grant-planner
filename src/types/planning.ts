// Updated planning types with engineer_id support
export interface PlanningEntry {
  engineer_id: string | null;  // New: UUID reference to engineers table
  konstrukter: string;         // Legacy: display name for compatibility
  cw: string;
  mesic: string;
  mhTyden?: number;
  projekt: string;
}

export interface EngineerInfo {
  id: string;
  display_name: string;
  slug: string;
  status: string;
}

export interface PlanningContextType {
  planningData: PlanningEntry[];
  engineers: EngineerInfo[];
  updatePlanningEntry: (konstrukter: string, cw: string, projekt: string, isTentative?: boolean) => Promise<void>;
  updatePlanningHours: (konstrukter: string, cw: string, hours: number) => Promise<void>;
}