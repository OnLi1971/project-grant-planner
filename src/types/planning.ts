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
  updatePlanningEntry: (konstrukter: string, cw: string, projekt: string) => Promise<void>;
  updatePlanningHours: (konstrukter: string, cw: string, hours: number) => Promise<void>;
  realtimeStatus: string;
  disableRealtime: () => void;
  enableRealtime: () => void;
  manualRefetch: () => void;
  checkWeekAxis: () => any;
  performStep1Test: () => void;
  fetchTimeline: Array<{id: number, startAt: string, endAt?: string, applied: boolean, source: string}>;
  getCurrentTimeline: () => Array<{id: number, startAt: string, endAt?: string, applied: boolean, source: string}>;
}