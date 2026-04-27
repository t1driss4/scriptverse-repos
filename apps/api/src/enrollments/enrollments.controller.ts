import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';

@Controller('enrollments')
@UseGuards(JwtAccessGuard)
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
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
