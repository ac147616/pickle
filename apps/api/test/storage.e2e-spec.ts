import { StorageService } from '../src/storage/storage.service';

// Needs the GCS emulator running (npm run db:up) - GCS_EMULATOR_HOST is set
// in apps/api/.env, loaded via jest-e2e.setup.ts like the other e2e specs.
describe('StorageService (e2e)', () => {
  let storage: StorageService;

  beforeAll(async () => {
    storage = new StorageService();
    await storage.onModuleInit();
  });

  it('round-trips a file through a signed upload URL', async () => {
    const objectPath = `e2e-test/${Date.now()}.txt`;
    const body = 'pickle storage round trip';

    const { uploadUrl, storagePath } = await storage.getSignedUploadUrl(
      objectPath,
      'text/plain',
    );
    expect(storagePath).toBe(objectPath);

    const putResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'text/plain' },
      body,
    });
    expect(putResponse.ok).toBe(true);

    // Confirms the bytes actually landed in the emulator, not just that the
    // PUT returned 200 - reads back via the emulator's own media endpoint
    // rather than trusting the write response alone.
    const readResponse = await fetch(
      `http://${process.env.GCS_EMULATOR_HOST}/download/storage/v1/b/${process.env.GCS_BUCKET}/o/${encodeURIComponent(objectPath)}?alt=media`,
    );
    expect(readResponse.ok).toBe(true);
    expect(await readResponse.text()).toBe(body);
  });
});
