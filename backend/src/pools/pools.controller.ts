import { Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { PoolsService } from './pools.service';

// Matches docs/api-contracts.md: accept, driver-arrived, start, complete,
// and get. Every route requires an authenticated driver, ownership of the
// specific pool is checked inside PoolsService, not here.
@Controller()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('DRIVER')
export class PoolsController {
  constructor(private readonly poolsService: PoolsService) {}

  @Post('pools/:rideRequestId/accept')
  accept(@Req() req: { user: { userId: string } }, @Param('rideRequestId') rideRequestId: string) {
    return this.poolsService.accept(req.user.userId, rideRequestId);
  }

  @Patch('pools/:id/driver-arrived')
  markDriverArrived(@Req() req: { user: { userId: string } }, @Param('id') id: string) {
    return this.poolsService.markDriverArrived(req.user.userId, id);
  }

  @Patch('pools/:id/start')
  start(@Req() req: { user: { userId: string } }, @Param('id') id: string) {
    return this.poolsService.start(req.user.userId, id);
  }

  @Patch('pools/:id/complete')
  complete(@Req() req: { user: { userId: string } }, @Param('id') id: string) {
    return this.poolsService.complete(req.user.userId, id);
  }

  @Get('pools/:id')
  findOne(@Req() req: { user: { userId: string } }, @Param('id') id: string) {
    return this.poolsService.findByIdForDriver(req.user.userId, id);
  }
}
