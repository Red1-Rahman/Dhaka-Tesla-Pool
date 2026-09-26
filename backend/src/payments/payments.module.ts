// backend/src/payments/payments.module.ts
import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';

// No controller, per docs/api-contracts.md there is no public payments
// endpoint, PaymentsService is only called internally by PoolsService.
@Module({
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
