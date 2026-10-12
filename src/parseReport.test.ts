import { describe, expect, it } from 'vitest';
import sample from '../public/sample-report.json';
import { parseReport, ReportParseError } from './parseReport';

describe('parseReport', () => {
  it('accepts the bundled sample report', () => {
    const report = parseReport(sample);

    expect(report.mode).toBe('demo');
    expect(report.summary.users.stale).toBe(5);
    expect(report.staleUsers).toHaveLength(5);
    expect(report.nonCompliantDevices).toHaveLength(5);
    expect(report.privilegedRoles).toHaveLength(6);
    expect(report.summary.devices.byOs.Windows).toBe(5);
  });

  it('keeps never-signed-in users with null dates', () => {
    const report = parseReport(sample);
    const never = report.staleUsers.find((user) => user.neverSignedIn);

    expect(never?.userPrincipalName).toBe('taylor.brooks@example.com');
    expect(never?.lastSignInDate).toBeNull();
    expect(never?.daysSinceSignIn).toBeNull();
  });

  it('rejects input that is not an object', () => {
    expect(() => parseReport(null)).toThrow(ReportParseError);
    expect(() => parseReport('nope')).toThrow(ReportParseError);
    expect(() => parseReport([])).toThrow(ReportParseError);
  });

  it('rejects an unsupported schema version', () => {
    expect(() => parseReport({ ...sample, schemaVersion: 2 })).toThrow(/schemaVersion/);
  });

  it('rejects an unknown mode', () => {
    expect(() => parseReport({ ...sample, mode: 'production' })).toThrow(/mode/);
  });

  it('points at the broken field when the summary is malformed', () => {
    const broken = { ...sample, summary: { ...sample.summary, users: { ...sample.summary.users, stale: 'five' } } };

    expect(() => parseReport(broken)).toThrow(/report\.summary\.users\.stale/);
  });

  it('rejects rows that miss required fields', () => {
    const broken = { ...sample, staleUsers: [{ displayName: 'No UPN' }] };

    expect(() => parseReport(broken)).toThrow(/staleUsers\[0\]\.userPrincipalName/);
  });

  it('accepts empty lists', () => {
    const empty = {
      ...sample,
      staleUsers: [],
      nonCompliantDevices: [],
      privilegedRoles: [],
    };

    expect(parseReport(empty).staleUsers).toEqual([]);
  });
});
