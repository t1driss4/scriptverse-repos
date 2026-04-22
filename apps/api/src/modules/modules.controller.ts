import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ModulesService } from './modules.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';

/**
 * Uses an empty controller prefix so route paths are declared in full,
 * enabling both nested (/courses/:courseId/modules) and standalone
 * (/modules/:id) patterns in a single controller.
 */
@Controller('')
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  /** Create a module inside a course (FORMATEUR + course owner) */
  @Post('courses/:courseId/modules')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(Role.FORMATEUR)
  create(
    @Param('courseId') courseId: string,
    @GetUser('sub') userId: string,
    @Body() dto: CreateModuleDto,
  ) {
    return this.modulesService.create(courseId, userId, dto);
  }

  /** List all modules for a course */
  @Get('courses/:courseId/modules')
  findByCourse(@Param('courseId') courseId: string) {
    return this.modulesService.findByCourse(courseId);
  }

  /** Get a single module with its lessons */
  @Get('modules/:id')
  findOne(@Param('id') id: string) {
    return this.modulesService.findOne(id);
  }

  /** Update a module (FORMATEUR + course owner) */
  @Patch('modules/:id')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(Role.FORMATEUR)
  update(
    @Param('id') id: string,
    @GetUser('sub') userId: string,
    @Body() dto: UpdateModuleDto,
  ) {
    return this.modulesService.update(id, userId, dto);
  }

  /** Delete a module (FORMATEUR + course owner) */
  @Delete('modules/:id')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(Role.FORMATEUR)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @GetUser('sub') userId: string) {
    return this.modulesService.remove(id, userId);
  }
}
