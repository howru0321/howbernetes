import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { containerDBConfig, workernodeDBConfig } from './typeorm.config';
import { WorkernodeModule } from './workernode/workernode.module';
import { ContainerModule } from './container/container.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(containerDBConfig),//container.sqlite 연결
    TypeOrmModule.forRoot(workernodeDBConfig),//workernode.sqlite 연결
    WorkernodeModule,
    ContainerModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
