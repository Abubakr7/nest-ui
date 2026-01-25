import { Module } from '@nestjs/common';
import { ApiTesterController } from './api-tester.controller';
import { ApiTesterService } from './api-tester.service';

@Module({
  controllers: [ApiTesterController],
  providers: [ApiTesterService],
  exports: [ApiTesterService],
})
export class ApiTesterModule {}
