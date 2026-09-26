import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../common/prisma.service';

// No controller, per docs/api-contracts.md there is no public payments
// endpoint, PaymentsService is only called internally by PoolsService.
@Module({
  providers: [PaymentsService, PrismaService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
