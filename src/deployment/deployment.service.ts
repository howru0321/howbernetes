import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios'
import { Deployment } from '../entities/deployment.entity'
import { DeploymentMetadata, ReplicasetMetadata } from '../interfaces/metadata.interface'

@Injectable()
export class DeploymentService {
    constructor(
        private readonly httpService: HttpService
    ) {}

    async updateDeploymentState(deploymentName: string, replicasetId : string, strategyType : string): Promise<string> {
        const deploymentMetadata : DeploymentMetadata =
        {
            name : deploymentName,
            replicasetid : replicasetId,
            strategyType : strategyType
        }
        
        const response = await lastValueFrom(
            this.httpService.post(
                'http://howbe-db-server:3001/deployment',
                {
                    deploymentName : deploymentName,
                    deploymentMetadata : deploymentMetadata
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

    async removeDeployment(deploymentName: string): Promise<string> {
        const response = await lastValueFrom(
            this.httpService.delete(
                `http://howbe-db-server:3001/deployment?name=${deploymentName}`
            ),
        );
        return response.data;
    }

    async getAllDeploymentList(): Promise<Deployment[]> {
        const response = await lastValueFrom(
            this.httpService.get('http://howbe-db-server:3001/deployment/getall'),
        );
        return response.data;
    }

    async getDeployment(deploymentName : string): Promise<Deployment> {
        const response = await lastValueFrom(
            this.httpService.get(`http://howbe-db-server:3001/deployment/get?name=${deploymentName}`),
        );
        return response.data;
    }

}
