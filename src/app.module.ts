import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { containerDBConfig, podDBConfig, replicasetDBConfig, workernodeDBConfig } from './typeorm.config';
import { ContainerModule } from './container/container.module';
import { PodModule } from './pod/pod.module';
import { ReplicasetModule } from './replicaset/replicaset.module';
import { WorkernodeModule } from './workernode/workernode.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(containerDBConfig),//container.sqlite 연결
    TypeOrmModule.forRoot(podDBConfig),//pod.sqlite 연결
    TypeOrmModule.forRoot(replicasetDBConfig),//replicaset.sqlite 연결
    TypeOrmModule.forRoot(workernodeDBConfig),//workernode.sqlite 연결
    WorkernodeModule,
    PodModule,
    ReplicasetModule,
    ContainerModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
