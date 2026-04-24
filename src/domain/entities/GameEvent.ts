export interface ShuttlecockTier {
  price: number;
  count: number;
}

export interface GameEvent {
  id: string;
  date: string;                               // ISO datetime
  playerIds: string[];                        // participating player IDs
  playerHours: Record<string, number>;        // playerId → hours (integer, min 1)
  /** cost per court per hour */
  courtCostPerHour: number;
  /** number of courts booked (used when courtsPerHour is empty) */
  numCourts: number;
  /** per-hour court count override: key = "1"|"2"|"3", value = courts. Empty = use numCourts for all hours */
  courtsPerHour: Record<string, number>;
  /** @deprecated kept for backward compat with saved events — use shuttlecockTiers instead */
  shuttlecockCostPerUnit: number;
  /** @deprecated kept for backward compat with saved events — use shuttlecockTiers instead */
  totalShuttlecocks: number;
  /** per-hour shuttle breakdown: key = "1"|"2"|"3", value = count. Empty = equal split */
  shuttlecocksPerHour: Record<string, number>;
  /** multi-tier shuttlecock pricing — replaces the single costPerUnit/total fields */
  shuttlecockTiers: ShuttlecockTier[];
  organizerFee: number;
  isFinalized: boolean;
  createdAt: string;
}
