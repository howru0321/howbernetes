import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { containerDBConfig, podDBConfig, deploymentDBConfig, workernodeDBConfig } from './typeorm.config';
import { ContainerModule } from './container/container.module';
import { PodModule } from './pod/pod.module';
import { DeploymentModule } from './deployment/deployment.module';
import { WorkernodeModule } from './workernode/workernode.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(containerDBConfig),//container.sqlite 연결
    TypeOrmModule.forRoot(podDBConfig),//pod.sqlite 연결
    TypeOrmModule.forRoot(deploymentDBConfig),//deployment.sqlite 연결
    TypeOrmModule.forRoot(workernodeDBConfig),//workernode.sqlite 연결
    WorkernodeModule,
    PodModule,
    DeploymentModule,
    ContainerModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
