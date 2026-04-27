import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LandingPage from '../LandingPage';

// Mock the store
vi.mock('../../store/useGameStore', () => ({
  useGameStore: (selector: any) => selector({
    savedGames: [],
    loadGame: vi.fn(),
  }),
}));

// Mock motion component to render as a simple div in test environment
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, className }: any) => <div className={className}>{children}</div>,
  },
}));

describe('LandingPage Component', () => {
  it('renders title and login button for unauthenticated users', () => {
    render(<LandingPage onStart={vi.fn()} user={null} onLogin={vi.fn()} />);
    
    expect(screen.getByText(/SENDA/i)).toBeInTheDocument();
    expect(screen.getByText(/QUEST/i)).toBeInTheDocument();
    expect(screen.getByText(/Sign In to Play/i)).toBeInTheDocument();
  });

  it('renders new adventure button for authenticated users', () => {
    const mockUser = { uid: '123', displayName: 'Hero', email: 'hero@test.com' } as any;
    render(<LandingPage onStart={vi.fn()} user={mockUser} onLogin={vi.fn()} />);
    
    expect(screen.getByText(/New Adventure/i)).toBeInTheDocument();
    expect(screen.getByText(/Logged in as Hero/i)).toBeInTheDocument();
  });
});
