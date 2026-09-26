import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

// Holds user-profile logic only. Auth (signup/signin/tokens) stays in
// AuthService, this service is what the rest of the app calls once a
// user already exists and is authenticated. See docs/conventions.md.
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { vehicle: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.toProfile(user);
  }

  async updateProfile(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id },
      data: dto,
      include: { vehicle: true },
    });
    return this.toProfile(user);
  }

  // Strips passwordHash out of anything returned to a controller, so it
  // is structurally impossible to accidentally leak it in a response.
  private toProfile(user: {
    id: string;
    name: string;
    phone: string;
    role: string;
    walletBalancePaisa: number;
    createdAt: Date;
    vehicle: { id: string; name: string; capacity: number; isOnline: boolean } | null;
  }) {
    return {
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      walletBalancePaisa: user.walletBalancePaisa,
      createdAt: user.createdAt,
      vehicle: user.vehicle,
    };
  }
}
