import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MobileNav from '../MobileNav';

describe('MobileNav Component', () => {
  const mockTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <span>📊</span> },
    { id: 'reports', label: 'Relatórios', icon: <span>📄</span> },
    { id: 'settings', label: 'Configurações', icon: <span>⚙️</span> },
  ];

  it('should render menu button', () => {
    const mockOnTabChange = vi.fn();
    render(
      <MobileNav 
        tabs={mockTabs} 
        activeTab="dashboard" 
        onTabChange={mockOnTabChange}
      />
    );
    
    const menuButton = screen.getByRole('button', { name: /abrir menu/i });
    expect(menuButton).toBeDefined();
  });

  it('should toggle menu visibility', () => {
    const mockOnTabChange = vi.fn();
    render(
      <MobileNav 
        tabs={mockTabs} 
        activeTab="dashboard" 
        onTabChange={mockOnTabChange}
      />
    );
    
    const menuButton = screen.getByRole('button', { name: /abrir menu/i });
    
    // Menu should not be visible initially
    expect(screen.queryByText('Relatórios')).toBeNull();
    
    // Click to open
    fireEvent.click(menuButton);
    expect(screen.getByText('Relatórios')).toBeDefined();
  });

  it('should call onTabChange when tab is clicked', () => {
    const mockOnTabChange = vi.fn();
    render(
      <MobileNav 
        tabs={mockTabs} 
        activeTab="dashboard" 
        onTabChange={mockOnTabChange}
      />
    );
    
    const menuButton = screen.getByRole('button', { name: /abrir menu/i });
    fireEvent.click(menuButton);
    
    const reportsButton = screen.getByRole('button', { name: /relatórios/i });
    fireEvent.click(reportsButton);
    
    expect(mockOnTabChange).toHaveBeenCalledWith('reports');
  });

  it('should have proper ARIA attributes', () => {
    const mockOnTabChange = vi.fn();
    render(
      <MobileNav 
        tabs={mockTabs} 
        activeTab="dashboard" 
        onTabChange={mockOnTabChange}
      />
    );
    
    const menuButton = screen.getByRole('button', { name: /abrir menu/i });
    expect(menuButton.getAttribute('aria-label')).toBeDefined();
    expect(menuButton.getAttribute('aria-expanded')).toBeDefined();
  });

  it('should render all tabs in menu', () => {
    const mockOnTabChange = vi.fn();
    render(
      <MobileNav 
        tabs={mockTabs} 
        activeTab="dashboard" 
        onTabChange={mockOnTabChange}
      />
    );
    
    const menuButton = screen.getByRole('button', { name: /abrir menu/i });
    fireEvent.click(menuButton);
    
    expect(screen.getByText('Dashboard')).toBeDefined();
    expect(screen.getByText('Relatórios')).toBeDefined();
    expect(screen.getByText('Configurações')).toBeDefined();
  });
});
