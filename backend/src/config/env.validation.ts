import { plainToInstance } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  validateSync,
} from 'class-validator';

// shape of every env var the app depends on; anything missing or malformed
// here stops the process at boot instead of failing later inside a request.
class EnvironmentVariables {
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsNotEmpty()
  JWT_SECRET!: string;

  // e.g. "1d", "12h". Optional so the app can fall back to its own default.
  @IsOptional()
  @IsString()
  JWT_EXPIRES_IN?: string;

  @IsOptional()
  @IsNumberString()
  PORT?: string;

  @IsOptional()
  @IsIn(['development', 'test', 'production'])
  NODE_ENV?: string;

  // Comma-separated list of browser origins allowed to call the API.
  // main.ts falls back to http://localhost:3000 when this is unset.
  @IsOptional()
  @IsString()
  CORS_ORIGIN?: string;
}

// validates process.env before ConfigModule hands it to the rest of the app.
export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    const messages = errors
      .map((error) => Object.values(error.constraints ?? {}).join(', '))
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${messages}`);
  }

  return validated;
}
