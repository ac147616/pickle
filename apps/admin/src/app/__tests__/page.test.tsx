import { render, screen } from '@testing-library/react';
import { UserRoleSchema } from '@pickle/types';

import Home from '../page';

// Proves the admin app can resolve both React rendering and the @pickle/types
// workspace package through the same Jest/TS config.
describe('workspace wiring', () => {
  it('resolves @pickle/types', () => {
    expect(UserRoleSchema.parse('SHIPPER')).toBe('SHIPPER');
  });

  it('renders the home page', () => {
    render(<Home />);
    expect(screen.getByText(/edit the page.tsx file/i)).toBeInTheDocument();
  });
});
