import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { FirebaseAdminService } from './firebase-admin.service';

export type AuthenticatedRequest = Request & {
  user?: { uid: string; email?: string | undefined; [key: string]: unknown };
};

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(FirebaseAuthGuard.name);

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
        ...decoded,
        uid: decoded.uid,
        email: decoded.email,
      };
      return true;
    } catch (err: any) {
      // Helpful diagnostics for local/dev without leaking the full token.
      const isProd = process.env.NODE_ENV === 'production';
      if (!isProd) {
        const tokenPrefix = token.slice(0, 12);
        const details = this.tryDecodeJwtDetails(token);
        this.logger.warn(
          `verifyIdToken failed: ${err?.code || 'unknown_code'} ${err?.message || ''} ` +
            `(tokenPrefix=${tokenPrefix}, aud=${details?.aud || 'n/a'}, iss=${details?.iss || 'n/a'})`
        );
      }
      throw new UnauthorizedException('Invalid token');
    }
  }

  private tryDecodeJwtDetails(
    token: string
  ): { aud?: string; iss?: string; exp?: number; iat?: number; sub?: string } | null {
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;
      const payload = parts[1];
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
      const json = Buffer.from(padded, 'base64').toString('utf8');
      const data = JSON.parse(json);
      return {
        aud: data?.aud,
        iss: data?.iss,
        exp: typeof data?.exp === 'number' ? data.exp : undefined,
        iat: typeof data?.iat === 'number' ? data.iat : undefined,
        sub: data?.sub,
      };
    } catch {
      return null;
    }
  }
}
