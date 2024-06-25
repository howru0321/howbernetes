import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Deployment } from '../entities/deployment.entity';
import { DeploymentController } from './deployment.controller';
import { DeploymentService } from './deployment.service';

@Module({
  imports: [TypeOrmModule.forFeature([Deployment], 'deploymentConnection')],
  controllers: [DeploymentController],
  providers: [DeploymentService]
})
export class DeploymentModule {}
