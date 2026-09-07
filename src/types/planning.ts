// Updated planning types with engineer_id support
export interface PlanningEntry {
  engineer_id: string | null;  // New: UUID reference to engineers table
  konstrukter: string;         // Legacy: display name for compatibility
  cw: string;
  mesic: string;
  mhTyden?: number;
  projekt: string;
  is_tentative?: boolean;      // New: flag for tentative reservations
  leaveDays?: number;          // New: number of leave days within the week (partial vacation)
  week_monday?: string;        // New: ISO Monday date for proportional calculations
  projekt2?: string | null;    // New: second project within the same week (split week)
  mhTyden2?: number;           // New: hours of the second project
  is_tentative2?: boolean;     // New: tentative flag of the second project
  isSecondary?: boolean;       // New: synthetic row representing the second project (for aggregations)
}

export interface EngineerInfo {
  id: string;
  display_name: string;
  slug: string;
  status: string;
  end_date?: string | null;
}

export interface PlanningContextType {
  planningData: PlanningEntry[];
  engineers: EngineerInfo[];
  updatePlanningEntry: (konstrukter: string, cw: string, projekt: string, isTentative?: boolean) => Promise<void>;
  updatePlanningHours: (konstrukter: string, cw: string, hours: number, leaveDays?: number) => Promise<void>;
  updatePlanningSecondary: (konstrukter: string, cw: string, projekt2: string | null, hours2: number, isTentative2?: boolean) => Promise<void>;
}
