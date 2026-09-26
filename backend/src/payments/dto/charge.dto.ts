// Not bound to any HTTP route, no controller calls this directly, per
// docs/api-contracts.md there is no POST /payments endpoint. This is the
// internal payload shape passed from PoolsService.complete() into
// PaymentsService.charge(), kept as a named type so both sides agree on
// the shape without importing each other's internals.
export interface ChargeDto {
  rideRequestId: string;
  amountPaisa: number;
  method: 'cash' | 'teslapay';
}
