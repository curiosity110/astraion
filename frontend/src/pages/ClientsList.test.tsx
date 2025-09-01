import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
vi.mock('../api', () => ({ api: vi.fn(() => Promise.resolve([])) }));
import ClientsList from './ClientsList';

describe('ClientsList states', () => {
  it('shows empty state', async () => {
    render(<ClientsList />);
    await new Promise((r) => setTimeout(r, 0));
    expect(screen.getByText('No clients found.')).toBeInTheDocument();
  });
});
