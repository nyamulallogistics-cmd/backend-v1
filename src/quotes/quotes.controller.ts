import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { CreateBidDto } from './dto/create-bid.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('quotes')
@UseGuards(JwtAuthGuard)
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Post()
  create(
    @CurrentUser() user: any,
    @Body() createQuoteDto: CreateQuoteDto,
  ) {
    return this.quotesService.create(user.id, createQuoteDto);
  }

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.quotesService.findAll(user.id, user.role);
  }

  @Get('active')
  getActive(@CurrentUser() user: any) {
    return this.quotesService.getActiveQuotes(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.quotesService.findOne(id, user.id, user.role);
  }

  @Get(':id/shipment')
  getQuoteShipment(@CurrentUser() user: any, @Param('id') id: string) {
    return this.quotesService.getQuoteShipment(id, user.id);
  }

  @Post(':id/bids')
  createBid(
    @CurrentUser() user: any,
    @Param('id') quoteId: string,
    @Body() createBidDto: CreateBidDto,
  ) {
    return this.quotesService.createBid(quoteId, user.id, createBidDto);
  }

  @Post(':quoteId/bids/:bidId/accept')
  acceptBid(
    @CurrentUser() user: any,
    @Param('quoteId') quoteId: string,
    @Param('bidId') bidId: string,
  ) {
    return this.quotesService.acceptBid(quoteId, bidId, user.id);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.quotesService.remove(id, user.id);
  }
}

