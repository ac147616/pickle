import { UserRoleSchema } from '@pickle/types';
import TestRenderer from 'react-test-renderer';

import { ThemedText } from '@/components/themed-text';

// Proves the mobile app can resolve both react-native rendering and the
// @pickle/types workspace package through the same Jest/TS config.
describe('workspace wiring', () => {
  it('resolves @pickle/types', () => {
    expect(UserRoleSchema.parse('SHIPPER')).toBe('SHIPPER');
  });

  it('renders a themed component', async () => {
    let tree: TestRenderer.ReactTestRenderer | undefined;
    await TestRenderer.act(async () => {
      tree = TestRenderer.create(<ThemedText>Pickle</ThemedText>);
    });
    expect(tree?.toJSON()).toBeTruthy();
  });
});
