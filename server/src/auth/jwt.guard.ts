import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const auth: string | undefined = request.headers['authorization'];

    if (!auth?.startsWith('Bearer '))
      throw new UnauthorizedException('Missing token');

    const token = auth.slice(7);
    try {
      const payload = jwt.verify(
        token,
        process.env.JWT_SECRET ?? 'changeme_jwt_secret_32chars',
      ) as any;
      request.userId = payload.sub as string;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
