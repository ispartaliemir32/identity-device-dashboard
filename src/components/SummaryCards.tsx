import type { Report } from '../types';

interface CardProps {
  label: string;
  value: number;
  detail: string;
  tone: 'ok' | 'warn';
}

function Card({ label, value, detail, tone }: CardProps) {
  return (
    <div className={`card card-${tone}`} role="group" aria-label={label}>
      <span className="card-label">{label}</span>
      <strong className="card-value">{value}</strong>
      <span className="card-detail">{detail}</span>
    </div>
  );
}

export function SummaryCards({ report }: { report: Report }) {
  const { users, devices, privilegedRoles } = report.summary;

  return (
    <div className="cards">
      <Card
        label="Stale users"
        value={users.stale}
        detail={`of ${users.enabled} enabled · no sign-in for ${report.staleDays}+ days`}
        tone={users.stale > 0 ? 'warn' : 'ok'}
      />
      <Card
        label="Non-compliant devices"
        value={devices.nonCompliant}
        detail={`of ${devices.total} managed devices`}
        tone={devices.nonCompliant > 0 ? 'warn' : 'ok'}
      />
      <Card
        label="Privileged assignments"
        value={privilegedRoles.assignments}
        detail={`${privilegedRoles.uniquePrincipals} unique principals`}
        tone="ok"
      />
    </div>
  );
}
