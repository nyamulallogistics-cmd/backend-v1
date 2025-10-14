import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ShipmentStatus } from '@prisma/client';

export class FilterShipmentDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(ShipmentStatus)
  status?: ShipmentStatus;

  @IsOptional()
  @IsString()
  fromLocation?: string;

  @IsOptional()
  @IsString()
  toLocation?: string;
}

