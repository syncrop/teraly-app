import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseAdminService {
  private readonly app: admin.app.App;

  constructor() {
    // Uses Application Default Credentials on Cloud Run.
    // Locally, make sure FIREBASE_PROJECT_ID matches the frontend Firebase projectId.
    const projectId =
      process.env.FIREBASE_PROJECT_ID ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      process.env.GCLOUD_PROJECT;

    this.app = admin.apps.length
      ? admin.app()
      : admin.initializeApp(projectId ? { projectId } : undefined);
  }

  auth(): admin.auth.Auth {
    return this.app.auth();
  }
}
