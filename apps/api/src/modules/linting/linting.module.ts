import { Module } from '@nestjs/common';
import { LintingController } from './linting.controller';
import { LintingService } from './linting.service';

@Module({
  controllers: [LintingController],
  providers: [LintingService],
  exports: [LintingService],
})
export class LintingModule {}
