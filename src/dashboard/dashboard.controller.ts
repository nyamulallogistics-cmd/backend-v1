import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  getDashboard(@CurrentUser() user: any) {
    if (user.role === 'CARGO_OWNER') {
      return this.dashboardService.getCargoOwnerDashboard(user.id);
    } else {
      return this.dashboardService.getTransporterDashboard(user.id);
    }
  }

  @Get('stats')
  getStats(@CurrentUser() user: any) {
    if (user.role === 'CARGO_OWNER') {
      return this.dashboardService.getCargoOwnerStats(user.id);
    } else {
      return this.dashboardService.getTransporterStats(user.id);
    }
  }

  @Get('cargo-owner')
  getCargoOwnerDashboard(@CurrentUser() user: any) {
    return this.dashboardService.getCargoOwnerDashboard(user.id);
  }

  @Get('transporter')
  getTransporterDashboard(@CurrentUser() user: any) {
    return this.dashboardService.getTransporterDashboard(user.id);
  }
}

