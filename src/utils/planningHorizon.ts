/** Keep the requested planning horizon while retaining a future year thereafter. */
export const planningEndYear = (date: Date = new Date()): number => Math.max(2028, date.getFullYear() + 1);