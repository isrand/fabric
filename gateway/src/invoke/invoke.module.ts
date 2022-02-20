import { Module } from '@nestjs/common';
import { InvokeService } from './invoke.service';
import { InvokeController } from './invoke.controller';

@Module({
  controllers: [InvokeController],
  providers: [InvokeService],
  exports: [InvokeService],
})
export class InvokeModule {}
