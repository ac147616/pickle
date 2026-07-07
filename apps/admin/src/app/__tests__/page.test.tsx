import { render, screen } from '@testing-library/react';
import { pickleMonorepoSchema } from '@pickle/types';

import Home from '../page';

// Proves the admin app can resolve both React rendering and the @pickle/types
// workspace package through the same Jest/TS config.
describe('workspace wiring', () => {
  it('resolves @pickle/types', () => {
    expect(pickleMonorepoSchema.parse({ scaffolded: true }).scaffolded).toBe(true);
  });

  it('renders the home page', () => {
    render(<Home />);
    expect(screen.getByText(/edit the page.tsx file/i)).toBeInTheDocument();
  });
});
