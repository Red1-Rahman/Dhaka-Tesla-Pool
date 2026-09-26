import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

interface JwtPayload {
  sub: string;
  role: string;
}

// Reads the Bearer token, verifies its signature against JWT_SECRET, and
// attaches the decoded payload to req.user for any route using
// @UseGuards(AuthGuard('jwt')) or the RolesGuard below.
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  // Whatever this returns becomes req.user in every guarded route.
  async validate(payload: JwtPayload) {
    return { userId: payload.sub, role: payload.role };
  }
}
