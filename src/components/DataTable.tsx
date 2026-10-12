import { useId, useMemo, useState, type ReactNode } from 'react';

export interface Column<T> {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  sortValue: (row: T) => string | number | null;
  numeric?: boolean;
}

interface DataTableProps<T> {
  title: string;
  rows: T[];
  columns: Column<T>[];
  getRowKey: (row: T) => string;
  searchText: (row: T) => string;
  emptyMessage: string;
}

type Direction = 'asc' | 'desc';

function compare(a: string | number | null, b: string | number | null): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1; // empty values always last
  if (b === null) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), undefined, { sensitivity: 'base' });
}

export function DataTable<T>({ title, rows, columns, getRowKey, searchText, emptyMessage }: DataTableProps<T>) {
  const headingId = useId();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<{ columnId: string; direction: Direction } | null>(null);

  const visibleRows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = needle ? rows.filter((row) => searchText(row).toLowerCase().includes(needle)) : rows;

    if (!sort) return filtered;
    const column = columns.find((c) => c.id === sort.columnId);
    if (!column) return filtered;

    const factor = sort.direction === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = column.sortValue(a);
      const bv = column.sortValue(b);
      // keep empty values last in both directions
      if (av === null || bv === null) return compare(av, bv);
      return factor * compare(av, bv);
    });
  }, [rows, columns, query, sort, searchText]);

  function toggleSort(columnId: string) {
    setSort((current) => {
      if (!current || current.columnId !== columnId) return { columnId, direction: 'asc' };
      if (current.direction === 'asc') return { columnId, direction: 'desc' };
      return null;
    });
  }

  return (
    <section className="panel" aria-labelledby={headingId}>
      <div className="panel-header">
        <h2 id={headingId}>{title}</h2>
        <span className="count" aria-live="polite">
          {visibleRows.length} of {rows.length}
        </span>
        <input
          className="search"
          type="search"
          placeholder="Filter…"
          aria-label={`Search ${title.toLowerCase()}`}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      {rows.length === 0 ? (
        <p className="empty">{emptyMessage}</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {columns.map((column) => {
                  const direction: Direction | null = sort !== null && sort.columnId === column.id ? sort.direction : null;
                  const ariaSort = direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : 'none';
                  return (
                    <th key={column.id} scope="col" aria-sort={ariaSort} className={column.numeric ? 'num' : undefined}>
                      <button type="button" className="sort" onClick={() => toggleSort(column.id)}>
                        {column.header}
                        <span aria-hidden="true" className="sort-indicator">
                          {direction === 'asc' ? ' ▲' : direction === 'desc' ? ' ▼' : ''}
                        </span>
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={getRowKey(row)}>
                  {columns.map((column) => (
                    <td key={column.id} className={column.numeric ? 'num' : undefined}>
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
              {visibleRows.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="empty">
                    No rows match “{query}”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
