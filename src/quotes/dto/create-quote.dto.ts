import { IsString, IsNumber, IsDateString, IsOptional, IsBoolean, Min } from 'class-validator';

export class CreateQuoteDto {
  @IsString()
  cargo: string;

  @IsOptional()
  @IsString()
  cargoType?: string;

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
  weight: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  distance?: number;

  @IsOptional()
  @IsString()
  dimensions?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedValue?: number;

  @IsOptional()
  @IsBoolean()
  insuranceRequired?: boolean;

  @IsOptional()
  @IsString()
  specialInstructions?: string;

  @IsOptional()
  @IsDateString()
  pickupDate?: string;

  @IsOptional()
  @IsDateString()
  deliveryDate?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

