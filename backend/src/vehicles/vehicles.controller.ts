import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { VehiclesService } from './vehicles.service';
import { SetOnlineDto } from './dto/set-online.dto';

// Matches docs/api-contracts.md: PATCH /vehicles/me/online.
// GET /vehicles/me is an addition beyond the documented contract, useful
// for a driver's dashboard to read its own vehicle state on load.
@Controller('vehicles')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('DRIVER')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get('me')
  getOwn(@Req() req: { user: { userId: string } }) {
    return this.vehiclesService.getOwn(req.user.userId);
  }

  @Patch('me/online')
  setOnline(@Req() req: { user: { userId: string } }, @Body() dto: SetOnlineDto) {
    return this.vehiclesService.setOnline(req.user.userId, dto.is_online);
  }
}
