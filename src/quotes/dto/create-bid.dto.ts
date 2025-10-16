import { IsNumber, IsString, IsOptional, Min } from 'class-validator';

/**
 * DTO for creating a bid on a quote
 * 
 * Important: A 20% platform fee is automatically deducted from the bid amount
 * - Transporter submits: amount (what cargo owner pays)
 * - Platform fee (20%): automatically calculated
 * - Transporter receives: amount - platformFee (80% of bid)
 * 
 * Example:
 * - Bid amount: $1000
 * - Platform fee: $200 (20%)
 * - Transporter receives: $800
 */
export class CreateBidDto {
  /**
   * Bid amount in USD
   * This is the amount the cargo owner will pay
   * The transporter will receive 80% of this amount after 20% platform fee
   */
  @IsNumber()
  @Min(0)
  amount: number;

  /**
   * Estimated delivery time in days
   */
  @IsNumber()
  @Min(1)
  estimatedDays: number;

  /**
   * Optional notes or special conditions for the bid
   */
  @IsOptional()
  @IsString()
  notes?: string;
}

