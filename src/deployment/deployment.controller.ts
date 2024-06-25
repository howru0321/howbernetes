import { Controller } from '@nestjs/common';
import { DeploymentService } from './deployment.service';
import { DeploymentMetadata } from '../interfaces/metadata.interface'
import { Deployment } from '../entities/deployment.entity';

@Controller('deployment')
export class DeploymentController {}
