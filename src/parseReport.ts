import type { Report } from './types';

export class ReportParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReportParseError';
  }
}

type Obj = Record<string, unknown>;

function isObject(value: unknown): value is Obj {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireObject(value: unknown, path: string): Obj {
  if (!isObject(value)) throw new ReportParseError(`"${path}" must be an object`);
  return value;
}

function requireNumber(obj: Obj, key: string, path: string): number {
  const value = obj[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new ReportParseError(`"${path}.${key}" must be a number`);
  }
  return value;
}

function requireString(obj: Obj, key: string, path: string): string {
  const value = obj[key];
  if (typeof value !== 'string') throw new ReportParseError(`"${path}.${key}" must be a string`);
  return value;
}

function requireArray(obj: Obj, key: string, path: string): Obj[] {
  const value = obj[key];
  if (!Array.isArray(value)) throw new ReportParseError(`"${path}.${key}" must be an array`);
  return value.map((item, index) => requireObject(item, `${path}.${key}[${index}]`));
}

/**
 * Validates untrusted JSON (for example a file picked by the user) and returns a typed report.
 * Only the structure produced by the entra-intune-automation project is accepted.
 */
export function parseReport(input: unknown): Report {
  const root = requireObject(input, 'report');

  if (root.schemaVersion !== 1) {
    throw new ReportParseError(`Unsupported schemaVersion: ${String(root.schemaVersion)} (expected 1)`);
  }

  const mode = requireString(root, 'mode', 'report');
  if (mode !== 'demo' && mode !== 'live') {
    throw new ReportParseError('"report.mode" must be "demo" or "live"');
  }

  const summary = requireObject(root.summary, 'report.summary');
  const users = requireObject(summary.users, 'report.summary.users');
  const devices = requireObject(summary.devices, 'report.summary.devices');
  const roles = requireObject(summary.privilegedRoles, 'report.summary.privilegedRoles');
  const byOsRaw = requireObject(devices.byOs, 'report.summary.devices.byOs');

  const byOs: Record<string, number> = {};
  for (const [name, count] of Object.entries(byOsRaw)) {
    if (typeof count !== 'number' || !Number.isFinite(count)) {
      throw new ReportParseError(`"report.summary.devices.byOs.${name}" must be a number`);
    }
    byOs[name] = count;
  }

  const staleUsers = requireArray(root, 'staleUsers', 'report').map((u, i) => {
    const path = `report.staleUsers[${i}]`;
    return {
      displayName: requireString(u, 'displayName', path),
      userPrincipalName: requireString(u, 'userPrincipalName', path),
      lastSignInDate: typeof u.lastSignInDate === 'string' ? u.lastSignInDate : null,
      daysSinceSignIn: typeof u.daysSinceSignIn === 'number' ? u.daysSinceSignIn : null,
      neverSignedIn: u.neverSignedIn === true,
    };
  });

  const nonCompliantDevices = requireArray(root, 'nonCompliantDevices', 'report').map((d, i) => {
    const path = `report.nonCompliantDevices[${i}]`;
    return {
      deviceName: requireString(d, 'deviceName', path),
      operatingSystem: requireString(d, 'operatingSystem', path),
      osVersion: typeof d.osVersion === 'string' ? d.osVersion : '',
      complianceState: requireString(d, 'complianceState', path),
      userPrincipalName: typeof d.userPrincipalName === 'string' ? d.userPrincipalName : '',
      lastSyncDate: typeof d.lastSyncDate === 'string' ? d.lastSyncDate : null,
      daysSinceSync: typeof d.daysSinceSync === 'number' ? d.daysSinceSync : null,
    };
  });

  const privilegedRoles = requireArray(root, 'privilegedRoles', 'report').map((r, i) => {
    const path = `report.privilegedRoles[${i}]`;
    return {
      roleName: requireString(r, 'roleName', path),
      principalName: requireString(r, 'principalName', path),
      principalType: typeof r.principalType === 'string' ? r.principalType : 'unknown',
    };
  });

  return {
    schemaVersion: 1,
    generatedAt: requireString(root, 'generatedAt', 'report'),
    mode,
    staleDays: requireNumber(root, 'staleDays', 'report'),
    summary: {
      users: {
        total: requireNumber(users, 'total', 'report.summary.users'),
        enabled: requireNumber(users, 'enabled', 'report.summary.users'),
        disabled: requireNumber(users, 'disabled', 'report.summary.users'),
        stale: requireNumber(users, 'stale', 'report.summary.users'),
      },
      devices: {
        total: requireNumber(devices, 'total', 'report.summary.devices'),
        nonCompliant: requireNumber(devices, 'nonCompliant', 'report.summary.devices'),
        byOs,
      },
      privilegedRoles: {
        assignments: requireNumber(roles, 'assignments', 'report.summary.privilegedRoles'),
        uniquePrincipals: requireNumber(roles, 'uniquePrincipals', 'report.summary.privilegedRoles'),
      },
    },
    staleUsers,
    nonCompliantDevices,
    privilegedRoles,
  };
}
