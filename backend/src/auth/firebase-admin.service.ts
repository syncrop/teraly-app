import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseAdminService {
  private readonly app: admin.app.App;

  constructor() {
    // Uses Application Default Credentials on Cloud Run.
    this.app = admin.apps.length ? admin.app() : admin.initializeApp();
  }

  auth(): admin.auth.Auth {
    return this.app.auth();
  }
}
