import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Deployment } from '../entities/deployment.entity';
import { DeploymentMetadata } from '../interfaces/metadata.interface'

@Injectable()
export class DeploymentService {
    constructor(
        @InjectRepository(Deployment, 'deploymentConnection')
        private readonly deploymentRepository: Repository<Deployment>,
    ){}
}
