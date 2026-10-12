export interface StaleUser {
  displayName: string;
  userPrincipalName: string;
  lastSignInDate: string | null;
  daysSinceSignIn: number | null;
  neverSignedIn: boolean;
}

export interface NonCompliantDevice {
  deviceName: string;
  operatingSystem: string;
  osVersion: string;
  complianceState: string;
  userPrincipalName: string;
  lastSyncDate: string | null;
  daysSinceSync: number | null;
}

export interface PrivilegedRoleAssignment {
  roleName: string;
  principalName: string;
  principalType: string;
}

export interface Report {
  schemaVersion: 1;
  generatedAt: string;
  mode: 'demo' | 'live';
  staleDays: number;
  summary: {
    users: { total: number; enabled: number; disabled: number; stale: number };
    devices: { total: number; nonCompliant: number; byOs: Record<string, number> };
    privilegedRoles: { assignments: number; uniquePrincipals: number };
  };
  staleUsers: StaleUser[];
  nonCompliantDevices: NonCompliantDevice[];
  privilegedRoles: PrivilegedRoleAssignment[];
}
