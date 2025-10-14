import { IsString, IsNumber, IsDateString, IsEnum, IsOptional, Min } from 'class-validator';
import { ShipmentStatus } from '@prisma/client';

export class CreateShipmentDto {
  @IsString()
  cargo: string;

  @IsOptional()
  @IsString()
  cargoDescription?: string;

  @IsString()
  fromLocation: string;

  @IsOptional()
  @IsString()
  fromAddress?: string;

  @IsString()
  toLocation: string;

  @IsOptional()
  @IsString()
  toAddress?: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsNumber()
  @Min(0)
  weight: number;

  @IsNumber()
  @Min(0)
  distance: number;

  @IsOptional()
  @IsString()
  dimensions?: string;

  @IsDateString()
  eta: string;

  @IsOptional()
  @IsString()
  transporterId?: string;

  @IsOptional()
  @IsString()
  quoteId?: string;

  @IsOptional()
  @IsString()
  driverName?: string;

  @IsOptional()
  @IsString()
  driverPhone?: string;

  @IsOptional()
  @IsString()
  truckNumber?: string;
}

