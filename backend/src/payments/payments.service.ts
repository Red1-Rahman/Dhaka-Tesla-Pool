import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { ChargeDto } from './dto/charge.dto';

// The third swap point from docs/architecture.md. charge() is the only
// public method, a real gateway (Stripe, bKash, Nagad) replaces only the
// body of this method later, callers (PoolsService) never change.
@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async charge(dto: ChargeDto) {
    // Cash and simulated TeslaPay both "succeed" immediately in this MVP,
    // there is no real gateway call to make yet, see Section 5 of the
    // brief: "no real gateway needed."
    return this.prisma.payment.create({
      data: {
        rideRequestId: dto.rideRequestId,
        method: dto.method,
        amountPaisa: dto.amountPaisa,
        status: 'completed',
      },
    });
  }
}
