import { useEffect, useState, type ChangeEvent } from 'react';
import { DataTable, type Column } from './components/DataTable';
import { OsChart } from './components/OsChart';
import { SummaryCards } from './components/SummaryCards';
import { parseReport } from './parseReport';
import type { NonCompliantDevice, PrivilegedRoleAssignment, Report, StaleUser } from './types';

const day = (iso: string | null) => (iso ? iso.slice(0, 10) : '—');

const userColumns: Column<StaleUser>[] = [
  { id: 'name', header: 'Name', cell: (u) => u.displayName, sortValue: (u) => u.displayName },
  { id: 'upn', header: 'User', cell: (u) => u.userPrincipalName, sortValue: (u) => u.userPrincipalName },
  {
    id: 'last',
    header: 'Last sign-in',
    cell: (u) => (u.neverSignedIn ? <em>never</em> : day(u.lastSignInDate)),
    sortValue: (u) => u.lastSignInDate,
  },
  {
    id: 'days',
    header: 'Days since sign-in',
    cell: (u) => (u.daysSinceSignIn === null ? '—' : u.daysSinceSignIn),
    sortValue: (u) => u.daysSinceSignIn,
    numeric: true,
  },
];

const deviceColumns: Column<NonCompliantDevice>[] = [
  { id: 'device', header: 'Device', cell: (d) => d.deviceName, sortValue: (d) => d.deviceName },
  {
    id: 'os',
    header: 'OS',
    cell: (d) => `${d.operatingSystem} ${d.osVersion}`.trim(),
    sortValue: (d) => `${d.operatingSystem} ${d.osVersion}`.trim(),
  },
  {
    id: 'state',
    header: 'State',
    cell: (d) => <span className={`badge badge-${d.complianceState}`}>{d.complianceState}</span>,
    sortValue: (d) => d.complianceState,
  },
  { id: 'user', header: 'User', cell: (d) => d.userPrincipalName || '—', sortValue: (d) => d.userPrincipalName || null },
  {
    id: 'sync',
    header: 'Days since sync',
    cell: (d) => (d.daysSinceSync === null ? '—' : d.daysSinceSync),
    sortValue: (d) => d.daysSinceSync,
    numeric: true,
  },
];

const roleColumns: Column<PrivilegedRoleAssignment>[] = [
  { id: 'role', header: 'Role', cell: (r) => r.roleName, sortValue: (r) => r.roleName },
  { id: 'principal', header: 'Principal', cell: (r) => r.principalName, sortValue: (r) => r.principalName },
  { id: 'type', header: 'Type', cell: (r) => r.principalType, sortValue: (r) => r.principalType },
];

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the file'));
    reader.readAsText(file);
  });
}

export default function App() {
  const [report, setReport] = useState<Report | null>(null);
  const [source, setSource] = useState('Bundled demo data');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`${import.meta.env.BASE_URL}sample-report.json`)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<unknown>;
      })
      .then((json) => {
        if (!cancelled) setReport(parseReport(json));
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(`Could not load the demo report: ${cause instanceof Error ? cause.message : String(cause)}`);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function onFileChosen(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const parsed = parseReport(JSON.parse(await readFileAsText(file)));
      setReport(parsed);
      setSource(file.name);
      setError(null);
    } catch (cause) {
      setError(`"${file.name}" is not a valid report: ${cause instanceof Error ? cause.message : String(cause)}`);
    }
  }

  return (
    <div className="app">
      <header className="top">
        <div>
          <h1>Identity &amp; Device Dashboard</h1>
          <p className="subtitle">
            Entra ID and Intune report data, shown entirely in your browser. Nothing is uploaded.
          </p>
        </div>
        <label className="file-button">
          Load report.json
          <input type="file" accept="application/json,.json" onChange={onFileChosen} />
        </label>
      </header>

      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}

      {!report && !error && <p className="empty">Loading…</p>}

      {report && (
        <main>
          <p className="meta">
            Source: <strong>{source}</strong> · mode: <strong>{report.mode}</strong> · generated{' '}
            <time dateTime={report.generatedAt}>{day(report.generatedAt)}</time>
          </p>

          <SummaryCards report={report} />

          <div className="grid">
            <DataTable
              title="Stale users"
              rows={report.staleUsers}
              columns={userColumns}
              getRowKey={(u) => u.userPrincipalName}
              searchText={(u) => `${u.displayName} ${u.userPrincipalName}`}
              emptyMessage="No stale users. Nice."
            />
            <OsChart byOs={report.summary.devices.byOs} />
          </div>

          <DataTable
            title="Non-compliant devices"
            rows={report.nonCompliantDevices}
            columns={deviceColumns}
            getRowKey={(d) => `${d.deviceName}-${d.userPrincipalName}`}
            searchText={(d) => `${d.deviceName} ${d.operatingSystem} ${d.complianceState} ${d.userPrincipalName}`}
            emptyMessage="All devices are compliant."
          />

          <DataTable
            title="Privileged role assignments"
            rows={report.privilegedRoles}
            columns={roleColumns}
            getRowKey={(r) => `${r.roleName}-${r.principalName}`}
            searchText={(r) => `${r.roleName} ${r.principalName} ${r.principalType}`}
            emptyMessage="No privileged role assignments found."
          />
        </main>
      )}

      <footer className="foot">
        Generated by{' '}
        <a href="https://github.com/ispartaliemir32/entra-intune-automation">entra-intune-automation</a>. Demo data is
        fictional.
      </footer>
    </div>
  );
}
