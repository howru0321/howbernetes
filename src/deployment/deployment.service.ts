import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios'
import { Deployment } from '../entities/deployment.entity';
import { DeploymentMetadata } from '../interfaces/metadata.interface'
import { PodTemplate } from '../interfaces/metadata.interface'

import { PodMetadata } from '../interfaces/metadata.interface'

@Injectable()
export class DeploymentService {
    constructor(
        private readonly httpService: HttpService
    ) {}

    async addDeployInfo(name: string, replicas : number, podidlist : string[], podtemplate : PodTemplate): Promise<string> {
        const deploymentMetadata : DeploymentMetadata =
        {
            name : name,
            replicas : replicas,
            podidlist : podidlist,
            podtemplate : podtemplate
        }
        
        const response = await lastValueFrom(
            this.httpService.post(
                'http://howbe-db-server:3001/deployment',
                {
                    name,
                    deploymentMetadata
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            ),
        );
        return response.data;
    }
}
