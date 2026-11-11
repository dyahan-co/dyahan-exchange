import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ActionButton } from './ActionButton';

describe('ActionButton', () => {
  it('renders its label with the default submit button styling', () => {
    render(<ActionButton>Save changes</ActionButton>);

    const button = screen.getByRole('button', { name: 'Save changes' });
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toHaveClass('MuiButton-contained', 'MuiButton-fullWidth', 'MuiButton-sizeLarge');
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<ActionButton onClick={onClick}>Continue</ActionButton>);

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('allows the caller to override the default button type', () => {
    render(<ActionButton type="button">Cancel</ActionButton>);

    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveAttribute('type', 'button');
  });
});
