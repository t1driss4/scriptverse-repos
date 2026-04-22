import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CoursesModule } from './courses/courses.module';
import { ModulesModule } from './modules/modules.module';
import { LessonsModule } from './lessons/lessons.module';

@Module({
  imports: [PrismaModule, AuthModule, CoursesModule, ModulesModule, LessonsModule],
})
export class AppModule {}
