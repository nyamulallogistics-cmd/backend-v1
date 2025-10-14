import { IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class CreateBidDto {
  @IsNumber()
  @Min(0)
  amount: number;

  @IsNumber()
  @Min(1)
  estimatedDays: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

