import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';

@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.APPRENANT)
  enroll(@GetUser('sub') userId: string, @Body() dto: CreateEnrollmentDto) {
    return this.enrollmentsService.enroll(userId, dto);
  }

  @Get('mine')
  findMine(@GetUser('sub') userId: string) {
    return this.enrollmentsService.findMine(userId);
  }

  @Get('mine/:courseId')
  findOne(@GetUser('sub') userId: string, @Param('courseId', ParseUUIDPipe) courseId: string) {
    return this.enrollmentsService.findOne(userId, courseId);
  }
}
