export type UpgradeId = 'mech_kb' | 'coffee' | 'intern' | 'copilot' | 'senior' | 'server';

export interface Upgrade {
  id: UpgradeId;
  name: string;
  description: string;
  baseCost: number;
  locPerSec: number;
  locPerClick: number;
}

export interface OwnedUpgrade {
  id: UpgradeId;
  count: number;
}

export interface Country {
  code: string;
  name: string;
  flag: string;
  totalLoc: number;
  updatedAt?: any;
}

