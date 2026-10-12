import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DataTable, type Column } from './DataTable';

interface Row {
  name: string;
  days: number | null;
}

const rows: Row[] = [
  { name: 'bravo', days: 30 },
  { name: 'alpha', days: null },
  { name: 'charlie', days: 120 },
];

const columns: Column<Row>[] = [
  { id: 'name', header: 'Name', cell: (r) => r.name, sortValue: (r) => r.name },
  { id: 'days', header: 'Days', cell: (r) => r.days ?? '—', sortValue: (r) => r.days, numeric: true },
];

function renderTable() {
  return render(
    <DataTable
      title="Things"
      rows={rows}
      columns={columns}
      getRowKey={(r) => r.name}
      searchText={(r) => r.name}
      emptyMessage="Nothing here"
    />,
  );
}

function names(): string[] {
  const body = screen.getAllByRole('rowgroup')[1];
  return within(body)
    .getAllByRole('row')
    .map((row) => within(row).getAllByRole('cell')[0].textContent ?? '');
}

describe('DataTable', () => {
  it('renders all rows in the given order by default', () => {
    renderTable();
    expect(names()).toEqual(['bravo', 'alpha', 'charlie']);
  });

  it('sorts ascending, then descending, then back to the original order', async () => {
    const user = userEvent.setup();
    renderTable();
    const header = screen.getByRole('button', { name: /^Name/ });

    await user.click(header);
    expect(names()).toEqual(['alpha', 'bravo', 'charlie']);

    await user.click(header);
    expect(names()).toEqual(['charlie', 'bravo', 'alpha']);

    await user.click(header);
    expect(names()).toEqual(['bravo', 'alpha', 'charlie']);
  });

  it('keeps empty values last in both directions', async () => {
    const user = userEvent.setup();
    renderTable();
    const header = screen.getByRole('button', { name: /^Days/ });

    await user.click(header);
    expect(names()).toEqual(['bravo', 'charlie', 'alpha']);

    await user.click(header);
    expect(names()).toEqual(['charlie', 'bravo', 'alpha']);
  });

  it('filters rows with the search box', async () => {
    const user = userEvent.setup();
    renderTable();

    await user.type(screen.getByRole('searchbox', { name: 'Search things' }), 'ar');

    expect(names()).toEqual(['charlie']);
    expect(screen.getByText('1 of 3')).toBeInTheDocument();
  });

  it('shows a message when nothing matches', async () => {
    const user = userEvent.setup();
    renderTable();

    await user.type(screen.getByRole('searchbox'), 'zzz');

    expect(screen.getByText(/No rows match/)).toBeInTheDocument();
  });

  it('shows the empty message when there are no rows at all', () => {
    render(
      <DataTable
        title="Things"
        rows={[]}
        columns={columns}
        getRowKey={(r: Row) => r.name}
        searchText={(r: Row) => r.name}
        emptyMessage="Nothing here"
      />,
    );

    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });
});
