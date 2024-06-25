import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Deployment } from '../entities/deployment.entity';
import { Pod } from '../entities/pod.entity'
import { Container } from 'src/entities/container.entity';
import { DeploymentController } from './deployment.controller';
import { DeploymentService } from './deployment.service';
import { PodService } from '../pod/pod.service'
import { ContainerService } from '../container/container.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([Deployment], 'deploymentConnection'),
    TypeOrmModule.forFeature([Pod], 'podConnection'),
    TypeOrmModule.forFeature([Container], 'containerConnection')
  ],
  controllers: [DeploymentController],
  providers: [
    DeploymentService,
    PodService,
    ContainerService
  ]
})
export class DeploymentModule {}
