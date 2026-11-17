import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../lib/api';
import { LoginForm } from './LoginPage';

describe('LoginForm', () => {
  it('shows validation errors and does not submit invalid input', async () => {
    const onSubmit = vi.fn();
    render(<LoginForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText('Email'), 'not-an-email');
    await userEvent.click(screen.getByTestId('login-submit'));

    expect(await screen.findByText('Enter a valid email')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('fills the demo admin credentials and submits them', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<LoginForm onSubmit={onSubmit} />);

    await userEvent.click(screen.getByTestId('fill-demo-admin'));
    await userEvent.click(screen.getByTestId('login-submit'));

    await vi.waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ email: 'admin@demo.com', password: 'Admin123!' }),
    );
  });

  it('displays the API error message when login fails', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new ApiError(401, 'Invalid email or password'));
    render(<LoginForm onSubmit={onSubmit} />);

    await userEvent.click(screen.getByTestId('fill-demo-staff'));
    await userEvent.click(screen.getByTestId('login-submit'));

    expect(await screen.findByTestId('login-error')).toHaveTextContent('Invalid email or password');
  });
});
