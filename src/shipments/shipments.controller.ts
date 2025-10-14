import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ShipmentsService } from './shipments.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { FilterShipmentDto } from './dto/filter-shipment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('shipments')
@UseGuards(JwtAuthGuard)
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Post()
  create(
    @CurrentUser() user: any,
    @Body() createShipmentDto: CreateShipmentDto,
  ) {
    return this.shipmentsService.create(user.id, createShipmentDto);
  }

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query() filterDto: FilterShipmentDto,
  ) {
    return this.shipmentsService.findAll(user.id, user.role, filterDto);
  }

  @Get('active')
  getActive(@CurrentUser() user: any) {
    return this.shipmentsService.getActiveShipments(user.id, user.role);
  }

  @Get('completed')
  getCompleted(@CurrentUser() user: any) {
    return this.shipmentsService.getCompletedShipments(user.id, user.role);
  }

  @Get('stats')
  getStats(@CurrentUser() user: any) {
    return this.shipmentsService.getShipmentStats(user.id, user.role);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.shipmentsService.findOne(id, user.id, user.role);
  }

  @Get(':id/progress')
  getProgressHistory(@CurrentUser() user: any, @Param('id') id: string) {
    return this.shipmentsService.getProgressHistory(id, user.id, user.role);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateShipmentDto: UpdateShipmentDto,
  ) {
    return this.shipmentsService.update(id, user.id, user.role, updateShipmentDto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.shipmentsService.remove(id, user.id);
  }
}

