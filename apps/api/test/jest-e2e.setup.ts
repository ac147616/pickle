import 'dotenv/config';

// Each spec's beforeAll boots a full Nest app - real Postgres pool, real
// Firebase Admin SDK, real GCS client - which can legitimately take a few
// seconds under a cold cache or loaded machine. Jest's 5s default hook
// timeout is tuned for unit tests, not this; observed real failures here
// (not a hypothetical), not a preemptive bump.
jest.setTimeout(30000);
