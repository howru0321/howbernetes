import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Container } from '../entities/container.entity';
import { ContainerController } from './container.controller';
import { ContainerService } from './container.service';

@Module({
  imports: [TypeOrmModule.forFeature([Container], 'containerConnection')],
  controllers: [ContainerController],
  providers: [ContainerService]
})
export class ContainerModule {}
