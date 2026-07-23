import { Injectable } from '@nestjs/common';

export interface NzbnLookupResult {
  nzbn: string;
  name: string;
  status: string;
  entityType: string;
}

// STUB: real MBIE/business.govt.nz NZBN API integration needs API access
// this project doesn't have yet - deliberately deferred (see milestone 1.1
// planning notes). Validates the NZBN format and returns a deterministic
// fake record so the rest of the onboarding flow (org creation, DTOs,
// mobile UI) can be built and tested now. Callers only depend on this
// class's public shape, so swapping in a real HTTP call later is a
// same-file change, not a ripple through the codebase.
@Injectable()
export class NzbnClient {
  lookup(nzbn: string): Promise<NzbnLookupResult | null> {
    if (!/^\d{13}$/.test(nzbn)) {
      return Promise.resolve(null);
    }
    return Promise.resolve({
      nzbn,
      name: `Test Company ${nzbn.slice(-4)} Limited`,
      status: 'Registered',
      entityType: 'Limited Company',
    });
  }
}
