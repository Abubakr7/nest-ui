import { Module } from '@nestjs/common';
import { ProjectsModule } from './modules/projects/projects.module';
import { FilesModule } from './modules/files/files.module';
import { AiModule } from './modules/ai/ai.module';
import { GeneratorModule } from './modules/generator/generator.module';
import { TerminalModule } from './modules/terminal/terminal.module';
import { ApiTesterModule } from './modules/api-tester/api-tester.module';
import { GitModule } from './modules/git/git.module';
import { DatabaseModule } from './modules/database/database.module';
import { DependenciesModule } from './modules/dependencies/dependencies.module';
import { TestingModule } from './modules/testing/testing.module';
import { DockerModule } from './modules/docker/docker.module';
import { EnvironmentModule } from './modules/environment/environment.module';
import { LintingModule } from './modules/linting/linting.module';
import { CicdModule } from './modules/cicd/cicd.module';
import { DocumentationModule } from './modules/documentation/documentation.module';
import { SnippetsModule } from './modules/snippets/snippets.module';

@Module({
  imports: [
    // Core modules
    ProjectsModule,
    FilesModule,
    AiModule,
    GeneratorModule,
    TerminalModule,
    ApiTesterModule,

    // New feature modules
    GitModule,
    DatabaseModule,
    DependenciesModule,
    TestingModule,
    DockerModule,
    EnvironmentModule,
    LintingModule,
    CicdModule,
    DocumentationModule,
    SnippetsModule,
  ],
})
export class AppModule {}
