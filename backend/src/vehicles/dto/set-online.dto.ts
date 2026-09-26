import { IsBoolean } from 'class-validator';

export class SetOnlineDto {
  @IsBoolean()
  is_online: boolean;
}
