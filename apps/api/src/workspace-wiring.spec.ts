import { pickleMonorepoSchema } from '@pickle/types';

// Proves the api app can resolve the @pickle/types workspace package
// through the same TS/Jest config used at runtime.
describe('workspace wiring', () => {
  it('resolves @pickle/types', () => {
    expect(pickleMonorepoSchema.parse({ scaffolded: true }).scaffolded).toBe(
      true,
    );
  });
});
