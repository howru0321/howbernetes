import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HttpModule } from '@nestjs/axios'; 
import { WorkernodeService } from './workernode/workernode.service';
import { WorkernodeModule } from './workernode/workernode.module';
import { ContainerService } from './container/container.service';
import { ContainerModule } from './container/container.module';
import { PodService } from './pod/pod.service'
import { PodModule } from './pod/pod.module'
import { DeploymentModule } from './deployment/deployment.module';
import { DeploymentService } from './deployment/deployment.service'


@Module({
  imports: [
    HttpModule,
    WorkernodeModule,
    ContainerModule,
    PodModule,
    DeploymentModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    WorkernodeService,
    ContainerService,
    PodService,
    DeploymentService
  ],
})
export class AppModule {}
