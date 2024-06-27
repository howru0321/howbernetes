import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pod } from '../entities/pod.entity';
import { PodController } from './pod.controller';
import { PodService } from './pod.service';
import { ContainerService } from '../container/container.service'
import { Container } from '../entities/container.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([Pod], 'podConnection'),
    //TypeOrmModule.forFeature([Container], 'containerConnection')
  ],
  controllers: [PodController],
  providers: [
    PodService,
    //ContainerService
  ]
})
export class PodModule {}
