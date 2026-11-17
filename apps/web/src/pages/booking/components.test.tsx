import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ClientDetailsForm, ServiceList, SlotPicker } from './components';

describe('SlotPicker', () => {
  const slots = [
    { start: '2026-12-01T12:00:00.000Z', end: '2026-12-01T12:30:00.000Z', time: '09:00' },
    { start: '2026-12-01T12:30:00.000Z', end: '2026-12-01T13:00:00.000Z', time: '09:30' },
  ];

  it('renders one button per available slot and reports the chosen one', async () => {
    const onSelect = vi.fn();
    render(<SlotPicker slots={slots} onSelect={onSelect} />);

    expect(screen.getAllByRole('button')).toHaveLength(2);
    await userEvent.click(screen.getByTestId('slot-option-09-30'));
    expect(onSelect).toHaveBeenCalledWith(slots[1]);
  });

  it('shows an empty state when the day is fully booked', () => {
    render(<SlotPicker slots={[]} onSelect={vi.fn()} />);
    expect(screen.getByTestId('slots-empty')).toHaveTextContent('No times available this day');
  });

  it('shows loading and error states', async () => {
    const { rerender } = render(<SlotPicker slots={undefined} loading onSelect={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveTextContent('Checking availability');

    const onRetry = vi.fn();
    rerender(
      <SlotPicker
        slots={undefined}
        error="Server unavailable"
        onRetry={onRetry}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Server unavailable');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalled();
  });
});

describe('ServiceList', () => {
  it('shows price in ARS and duration, with stable test ids', async () => {
    const onSelect = vi.fn();
    const service = {
      id: 's1',
      name: 'Classic Haircut',
      description: null,
      durationMinutes: 30,
      price: 9000,
    };
    render(<ServiceList services={[service]} onSelect={onSelect} />);

    const option = screen.getByTestId('service-option-classic-haircut');
    expect(option).toHaveTextContent('30 min');
    expect(option).toHaveTextContent(/\$\s?9\.000/);
    await userEvent.click(option);
    expect(onSelect).toHaveBeenCalledWith(service);
  });
});

describe('ClientDetailsForm', () => {
  it('validates required fields before submitting', async () => {
    const onSubmit = vi.fn();
    render(<ClientDetailsForm onSubmit={onSubmit} />);

    await userEvent.click(screen.getByTestId('submit-booking'));

    expect(await screen.findByText('Please enter your full name')).toBeInTheDocument();
    expect(screen.getByText('Please enter a valid phone number')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits trimmed values when the form is valid', async () => {
    const onSubmit = vi.fn();
    render(<ClientDetailsForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText('Full name'), '  Juan Pérez ');
    await userEvent.type(screen.getByLabelText('Phone'), '+54 379 4501234');
    await userEvent.click(screen.getByTestId('submit-booking'));

    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      name: 'Juan Pérez',
      phone: '+54 379 4501234',
      email: '',
    });
  });
});
