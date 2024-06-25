import { Module } from '@nestjs/common';
import { PodController } from './pod.controller';
import { PodService } from './pod.service';
import { HttpModule } from '@nestjs/axios'; 

@Module({
  imports: [HttpModule],
  controllers: [PodController],
  providers: [PodService]
})
export class PodModule {}
