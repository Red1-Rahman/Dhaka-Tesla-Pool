import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './common/prisma.module';
import { HealthModule } from './health/health.module';

// Feature modules below already exist on disk (see docs/codebase.md and the
// prior feature/* branches) but were never imported anywhere, because this
// file didn't exist. Wiring them here is what turns them from dead files
// into live, routable modules.
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { RidesModule } from './rides/rides.module';
import { PoolsModule } from './pools/pools.module';
import { PaymentsModule } from './payments/payments.module';
import { GeoModule } from './geo/geo.module';
import { FareModule } from './fare/fare.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    VehiclesModule,
    RidesModule,
    PoolsModule,
    PaymentsModule,
    GeoModule,
    FareModule,
  ],
})
export class AppModule {}
