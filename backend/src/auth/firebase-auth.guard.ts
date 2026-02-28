import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { FirebaseAdminService } from './firebase-admin.service';

export type AuthenticatedRequest = Request & {
  user?: { uid: string; email?: string | undefined; [key: string]: unknown };
};

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(private readonly firebaseAdmin: FirebaseAdminService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const header = req.headers['authorization'];
    if (!header || Array.isArray(header)) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const match = header.match(/^Bearer\s+(.+)$/i);
    if (!match) {
      throw new UnauthorizedException('Invalid Authorization header');
    }

    const token = match[1];

    try {
      const decoded = await this.firebaseAdmin.auth().verifyIdToken(token);
      req.user = {
        uid: decoded.uid,
        email: decoded.email,
        ...decoded,
      };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
