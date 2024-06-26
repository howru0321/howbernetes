import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Replicaset } from '../entities/replicaset.entity';
import { Pod } from '../entities/pod.entity'
import { Container } from 'src/entities/container.entity';
import { ReplicasetController } from './replicaset.controller';
import { ReplicasetService } from './replicaset.service';
import { PodService } from '../pod/pod.service'
import { ContainerService } from '../container/container.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([Replicaset], 'replicasetConnection'),
    TypeOrmModule.forFeature([Pod], 'podConnection'),
    TypeOrmModule.forFeature([Container], 'containerConnection')
  ],
  controllers: [ReplicasetController],
  providers: [
    ReplicasetService,
    PodService,
    ContainerService
  ]
})
export class ReplicasetModule {}
