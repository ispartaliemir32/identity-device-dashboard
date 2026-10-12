interface OsChartProps {
  byOs: Record<string, number>;
}

/** Horizontal bar chart built from plain elements, so it needs no chart library. */
export function OsChart({ byOs }: OsChartProps) {
  const entries = Object.entries(byOs).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const max = Math.max(1, ...entries.map(([, count]) => count));

  return (
    <section className="panel" aria-label="Devices by operating system">
      <div className="panel-header">
        <h2>Devices by operating system</h2>
      </div>
      {entries.length === 0 ? (
        <p className="empty">No devices in this report.</p>
      ) : (
        <ul className="bars">
          {entries.map(([name, count]) => (
            <li key={name} className="bar-row">
              <span className="bar-label">{name}</span>
              <span className="bar-track" aria-hidden="true">
                <span className="bar-fill" style={{ width: `${(count / max) * 100}%` }} />
              </span>
              <span className="bar-count">{count}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
