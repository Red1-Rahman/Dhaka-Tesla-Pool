import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma.service';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';

// All auth business logic lives here, the controller only validates
// input shape and delegates. See docs/conventions.md.
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(dto: SignupDto) {
    const existing = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });
    if (existing) {
      throw new ConflictException('A user with this phone number already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        phone: dto.phone,
        passwordHash,
        role: dto.role,
      },
    });

    return this.buildAuthResponse(user.id, user.name, user.role);
  }

  async signin(dto: SigninDto) {
    const user = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid phone number or password');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid phone number or password');
    }

    return this.buildAuthResponse(user.id, user.name, user.role);
  }

  // Shared by signup and signin so the token payload and response shape
  // (docs/api-contracts.md) can never drift between the two endpoints.
  private buildAuthResponse(id: string, name: string, role: string) {
    const token = this.jwtService.sign({ sub: id, role });
    return { id, name, role, token };
  }
}
