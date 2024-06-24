import { Module } from '@nestjs/common';
import { WorkernodeController } from './workernode.controller';
import { WorkernodeService } from './workernode.service';
import { HttpModule } from '@nestjs/axios'; 

@Module({
  imports: [HttpModule],
  controllers: [WorkernodeController],
  providers: [WorkernodeService]
})
export class WorkernodeModule {}
