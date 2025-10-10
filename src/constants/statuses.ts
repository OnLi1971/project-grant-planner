export const ACTIVE_ENGINEER_STATUSES = ['active', 'contractor', 'on_leave'] as const;
export type EngineerStatus = typeof ACTIVE_ENGINEER_STATUSES[number];
