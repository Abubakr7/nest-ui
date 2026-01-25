import { Module } from '@nestjs/common';
import { ProjectsModule } from './modules/projects/projects.module';
import { FilesModule } from './modules/files/files.module';
import { AiModule } from './modules/ai/ai.module';
import { GeneratorModule } from './modules/generator/generator.module';
import { TerminalModule } from './modules/terminal/terminal.module';
import { ApiTesterModule } from './modules/api-tester/api-tester.module';

@Module({
  imports: [
    ProjectsModule,
    FilesModule,
    AiModule,
    GeneratorModule,
    TerminalModule,
    ApiTesterModule,
  ],
})
export class AppModule {}
