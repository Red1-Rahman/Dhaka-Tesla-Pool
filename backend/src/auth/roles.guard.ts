import { CanActivate, ExecutionContext, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

// Usage on a controller method: @Roles('DRIVER') @UseGuards(AuthGuard('jwt'), RolesGuard)
// Kept in the same file as RolesGuard since the two are never used apart,
// see docs/conventions.md on not splitting tightly coupled pieces
// across files just for the sake of one-file-one-export.
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @Roles decorator on this route means any authenticated user is fine,
    // the JwtStrategy guard is what handles "authenticated at all."
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return requiredRoles.includes(user?.role);
  }
}
