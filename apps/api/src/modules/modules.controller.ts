import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ModulesService } from './modules.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';

// Empty prefix: full paths declared inline to support nested + standalone patterns.
@Controller('')
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  /** Create a module inside a course (FORMATEUR + course owner) */
  @Post('courses/:courseId/modules')
  @UseGuards(RolesGuard)
  @Roles(Role.FORMATEUR)
  create(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @GetUser('sub') userId: string,
    @Body() dto: CreateModuleDto,
  ) {
    return this.modulesService.create(courseId, userId, dto);
  }

  /** List all modules for a course */
  @Public()
  @Get('courses/:courseId/modules')
  findByCourse(@Param('courseId', ParseUUIDPipe) courseId: string) {
    return this.modulesService.findByCourse(courseId);
  }

  /** Get a single module with its lessons */
  @Public()
  @Get('modules/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.modulesService.findOne(id);
  }

  /** Update a module (FORMATEUR + course owner) */
  @Patch('modules/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.FORMATEUR)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('sub') userId: string,
    @Body() dto: UpdateModuleDto,
  ) {
    return this.modulesService.update(id, userId, dto);
  }

  /** Delete a module (FORMATEUR + course owner) */
  @Delete('modules/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.FORMATEUR)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string, @GetUser('sub') userId: string) {
    return this.modulesService.remove(id, userId);
  }
}
