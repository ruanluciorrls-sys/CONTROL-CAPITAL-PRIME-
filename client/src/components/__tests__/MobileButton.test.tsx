import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MobileButton from '../MobileButton';
import { Plus } from 'lucide-react';

describe('MobileButton Component', () => {
  it('should render button with text', () => {
    render(<MobileButton>Click me</MobileButton>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeDefined();
  });

  it('should render button with icon', () => {
    render(
      <MobileButton icon={<Plus size={20} />}>
        Add
      </MobileButton>
    );
    const button = screen.getByRole('button', { name: /add/i });
    expect(button).toBeDefined();
    expect(button.querySelector('svg')).toBeDefined();
  });

  it('should have minimum height of 44px for touch targets', () => {
    const { container } = render(<MobileButton size="md">Touch</MobileButton>);
    const button = container.querySelector('button');
    expect(button?.className.includes('min-h-[44px]')).toBe(true);
  });

  it('should apply correct variant styles', () => {
    const { container: primaryContainer } = render(
      <MobileButton variant="primary">Primary</MobileButton>
    );
    expect(primaryContainer.querySelector('button')?.className.includes('bg-primary')).toBe(true);

    const { container: dangerContainer } = render(
      <MobileButton variant="danger">Danger</MobileButton>
    );
    expect(dangerContainer.querySelector('button')?.className.includes('bg-red-500')).toBe(true);
  });

  it('should apply correct size styles', () => {
    const { container: smContainer } = render(
      <MobileButton size="sm">Small</MobileButton>
    );
    expect(smContainer.querySelector('button')?.className.includes('min-h-[40px]')).toBe(true);

    const { container: lgContainer } = render(
      <MobileButton size="lg">Large</MobileButton>
    );
    expect(lgContainer.querySelector('button')?.className.includes('min-h-[48px]')).toBe(true);
  });

  it('should fill width when fullWidth prop is true', () => {
    const { container } = render(
      <MobileButton fullWidth>Full Width</MobileButton>
    );
    expect(container.querySelector('button')?.className.includes('w-full')).toBe(true);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<MobileButton disabled>Disabled</MobileButton>);
    const button = screen.getByRole('button', { name: /disabled/i }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('should call onClick handler', () => {
    const handleClick = vi.fn();
    render(<MobileButton onClick={handleClick}>Click</MobileButton>);
    
    const button = screen.getByRole('button', { name: /click/i });
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('should have focus ring for accessibility', () => {
    const { container } = render(<MobileButton>Focus</MobileButton>);
    expect(container.querySelector('button')?.className.includes('focus:ring-2')).toBe(true);
  });
});
