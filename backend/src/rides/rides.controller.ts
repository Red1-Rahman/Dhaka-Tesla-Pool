import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { RidesService } from './rides.service';
import { CreateRideDto } from './dto/create-ride.dto';
import { CancelRideDto } from './dto/cancel-ride.dto';

// Matches docs/api-contracts.md: POST /rides, GET /rides/:id,
// GET /rides/me, PATCH /rides/:id/cancel. All routes require a passenger.
@Controller('rides')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('PASSENGER')
export class RidesController {
  constructor(private readonly ridesService: RidesService) {}

  @Post()
  create(@Req() req: { user: { userId: string } }, @Body() dto: CreateRideDto) {
    return this.ridesService.create(req.user.userId, dto);
  }

  @Get('me')
  findMine(@Req() req: { user: { userId: string } }) {
    return this.ridesService.findOwnRides(req.user.userId);
  }

  @Get(':id')
  findOne(@Req() req: { user: { userId: string } }, @Param('id') id: string) {
    return this.ridesService.findOwnRideById(req.user.userId, id);
  }

  @Patch(':id/cancel')
  cancel(
    @Req() req: { user: { userId: string } },
    @Param('id') id: string,
    @Body() dto: CancelRideDto,
  ) {
    return this.ridesService.cancel(req.user.userId, id, dto);
  }
}
