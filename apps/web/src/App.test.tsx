import { render, screen } from '@testing-library/react';
import App from './App';

it('renders the brand name', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: 'BookFlow' })).toBeInTheDocument();
});
