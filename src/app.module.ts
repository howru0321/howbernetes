import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HttpModule } from '@nestjs/axios'; 
import { WorkernodeModule } from './workernode/workernode.module';
import { WorkernodeService } from './workernode/workernode.service';
import { ContainerService } from './container/container.service';
import { ContainerModule } from './container/container.module';


@Module({
  imports: [HttpModule, WorkernodeModule, ContainerModule],
  controllers: [AppController],
  providers: [AppService, WorkernodeService, ContainerService],
})
export class AppModule {}
