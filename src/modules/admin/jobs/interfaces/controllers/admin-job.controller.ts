import { Controller, Get, Put, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AdminJobService } from '../../application/services/admin-job.service';
import { UpdateJobScheduleDto } from '../../application/dto/update-job-schedule.dto';

@ApiTags('Admin - Jobs')
@Controller('admin/jobs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class AdminJobController {
  constructor(private readonly adminJobService: AdminJobService) {}

  @Get()
  @ApiOperation({ summary: 'Get all scheduled jobs (Admin only)' })
  async getAllJobs() {
    return this.adminJobService.getAllJobs();
  }

  @Get(':name')
  @ApiOperation({ summary: 'Get job by name (Admin only)' })
  @ApiParam({ name: 'name', description: 'Job name' })
  async getJob(@Param('name') name: string) {
    return this.adminJobService.getJob(name);
  }

  @Put(':name/schedule')
  @ApiOperation({ summary: 'Update job schedule (Admin only)' })
  @ApiParam({ name: 'name', description: 'Job name' })
  async updateJobSchedule(@Param('name') name: string, @Body() updateDto: UpdateJobScheduleDto) {
    return this.adminJobService.updateJobSchedule(name, updateDto);
  }

  @Post(':name/trigger')
  @ApiOperation({ summary: 'Trigger job manually (Admin only)' })
  @ApiParam({ name: 'name', description: 'Job name' })
  async triggerJob(@Param('name') name: string) {
    return this.adminJobService.triggerJob(name);
  }
}

