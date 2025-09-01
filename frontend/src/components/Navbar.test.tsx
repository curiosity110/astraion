import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Navbar from './Navbar';
import { WebSocketProvider } from './WebSocketProvider';

describe('Navbar', () => {
  it('renders links', () => {
    render(
      <WebSocketProvider>
        <Navbar />
      </WebSocketProvider>
    );
    expect(screen.getByText('Dashboard').getAttribute('href')).toBe('/dashboard');
    expect(screen.getByText('Trips').getAttribute('href')).toBe('/trips');
    expect(screen.getByText('Clients').getAttribute('href')).toBe('/clients');
  });
});
