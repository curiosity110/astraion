import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
vi.mock('../api', () => ({ api: vi.fn(() => Promise.resolve([])) }));
import { api } from '../api';
import TripsList from './TripsList';

describe('TripsList filters', () => {
  it('calls API with filters', async () => {
    render(<TripsList />);
    fireEvent.change(screen.getByPlaceholderText('Destination'), { target: { value: 'Paris' } });
    await new Promise((r) => setTimeout(r, 0));
    expect(api).toHaveBeenCalledWith('/api/trips/?destination=Paris');
  });
});
