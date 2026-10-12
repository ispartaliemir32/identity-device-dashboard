import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import sample from '../public/sample-report.json';
import App from './App';

describe('App', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => sample }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads the demo report and shows the summary cards', async () => {
    render(<App />);

    expect(await screen.findByText('taylor.brooks@example.com')).toBeInTheDocument();

    expect(within(screen.getByRole('group', { name: 'Stale users' })).getByText('5')).toBeInTheDocument();
    expect(within(screen.getByRole('group', { name: 'Non-compliant devices' })).getByText('5')).toBeInTheDocument();
    expect(within(screen.getByRole('group', { name: 'Privileged assignments' })).getByText('6')).toBeInTheDocument();
  });

  it('filters the stale users table', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('taylor.brooks@example.com');

    await user.type(screen.getByRole('searchbox', { name: 'Search stale users' }), 'casey');

    const staleUsers = screen.getByRole('region', { name: 'Stale users' });
    expect(within(staleUsers).getByText('casey.kim@example.com')).toBeInTheDocument();
    expect(within(staleUsers).queryByText('jordan.lee@example.com')).not.toBeInTheDocument();
  });

  it('shows an error when the demo report cannot be loaded', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({}) }));

    render(<App />);

    expect(await screen.findByRole('alert')).toHaveTextContent('HTTP 404');
  });
});
