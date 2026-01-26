import { Module } from '@nestjs/common';
import { DocumentationController } from './documentation.controller';
import { DocumentationService } from './documentation.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [DocumentationController],
  providers: [DocumentationService],
  exports: [DocumentationService],
})
export class DocumentationModule {}
