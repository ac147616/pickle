import { generateKeyPairSync } from 'crypto';

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';

export interface SignedUploadUrl {
  uploadUrl: string;
  storagePath: string;
}

// CLAUDE.md: files go to private GCS buckets, served via short-lived signed
// URLs only. No real GCP project exists yet - GCS_EMULATOR_HOST (set in
// apps/api/.env for dev/test) redirects every call to the local
// fake-gcs-server container instead (see docker-compose.yml's `gcs`
// service). getSignedUrl() bakes apiEndpoint's host directly into the
// returned URL, so a physical phone testing against this emulator needs
// GCS_EMULATOR_HOST set to this machine's LAN IP (not "localhost") *and*
// docker-compose.yml's GCS_PUBLIC_HOST kept in sync - fake-gcs-server
// strictly matches incoming requests' Host header against its configured
// -public-host. Same manual-override pattern as EXPO_PUBLIC_DEV_HOST on the
// mobile side, for the same underlying reason (this machine's "localhost"
// isn't reachable from another device on the network).
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly storage: Storage;
  private readonly bucketName: string;
  private readonly emulatorHost: string | undefined;

  constructor() {
    this.bucketName = process.env.GCS_BUCKET ?? 'pickle-verification-docs';
    this.emulatorHost = process.env.GCS_EMULATOR_HOST;

    this.storage = this.emulatorHost
      ? new Storage({
          apiEndpoint: `http://${this.emulatorHost}`,
          projectId: 'demo-pickle',
          useAuthWithCustomEndpoint: false,
          // getSignedUrl() always signs with RSA-SHA256 client-side, even
          // against the emulator (which never verifies the signature) - it
          // needs a syntactically real key or it falls through to an
          // application-default-credentials lookup that fails outside GCP.
          // Nothing ever checks this against a real identity, so one
          // process-wide throwaway keypair is fine - RSA-2048 generation is
          // expensive enough that regenerating it per instance caused e2e
          // test timeouts under Jest's parallel workers (multiple
          // StorageService bootstraps competing for CPU at once).
          credentials: {
            client_email: 'emulator@demo-pickle.iam.gserviceaccount.com',
            private_key: getEmulatorSigningKey(),
          },
        })
      : new Storage();
  }

  async onModuleInit(): Promise<void> {
    // Real GCP buckets are provisioned out-of-band (infra-as-code, later
    // milestone) - this self-provisioning is emulator-only.
    if (!this.emulatorHost) {
      return;
    }
    const bucket = this.storage.bucket(this.bucketName);
    const [exists] = await bucket.exists();
    if (!exists) {
      await bucket.create();
      this.logger.log(`Created emulator bucket "${this.bucketName}"`);
    }
  }

  async getSignedUploadUrl(
    objectPath: string,
    contentType: string,
  ): Promise<SignedUploadUrl> {
    const [uploadUrl] = await this.storage
      .bucket(this.bucketName)
      .file(objectPath)
      .getSignedUrl({
        version: 'v4',
        action: 'write',
        expires: Date.now() + 15 * 60 * 1000,
        contentType,
      });

    return { uploadUrl, storagePath: objectPath };
  }
}

let cachedEmulatorSigningKey: string | undefined;

function getEmulatorSigningKey(): string {
  if (!cachedEmulatorSigningKey) {
    const { privateKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      publicKeyEncoding: { type: 'spki', format: 'pem' },
    });
    cachedEmulatorSigningKey = privateKey;
  }
  return cachedEmulatorSigningKey;
}
