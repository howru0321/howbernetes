import { Module } from '@nestjs/common';
import { DeploymentController } from './deployment.controller';
import { DeploymentService } from './deployment.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Deployment } from '../entities/deployment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Deployment], 'deploymentConnection'),
  ],
  controllers: [DeploymentController],
  providers: [DeploymentService]
})
export class DeploymentModule {}
