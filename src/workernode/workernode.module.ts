import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkerNode } from '../entities/workernode.entity';
import { WorkernodeService } from './workernode.service';
import { WorkernodeController } from './workernode.controller';

@Module({
  imports: [TypeOrmModule.forFeature([WorkerNode], 'workernodeConnection')],
  providers: [WorkernodeService],
  controllers: [WorkernodeController]
})
export class WorkernodeModule {}
