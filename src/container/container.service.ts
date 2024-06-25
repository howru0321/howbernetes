import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios'
import { Container } from '../entities/container.entity';
import { ContainerMetadata } from '../interfaces/metadata.interface';

@Injectable()
export class ContainerService {
    constructor(
        private readonly httpService: HttpService
    ) {}

    async addContainerInfo(name: string, pod: string, deployment : string, workernode: string, metadata : string): Promise<string> {
        const containerMetadata : ContainerMetadata =
        {
            name : name,
            pod : pod,
            deployment : deployment,
            workernode : workernode,
            metadata : metadata
        }
        
        const response = await lastValueFrom(
            this.httpService.post(
                'http://howbe-db-server:3001/container',
                {
                    name,
                    containerMetadata
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

    async removeContainerInfo(containerName: string): Promise<string> {
        const response = await lastValueFrom(
            this.httpService.delete(
                `http://howbe-db-server:3001/container?name=${containerName}`
            ),
        );
        return response.data;
    }

    async getAllContainerList(): Promise<Container[]> {
        const response = await lastValueFrom(
            this.httpService.get('http://howbe-db-server:3001/container/getall'),
        );
        return response.data;
    }

    async getContainer(containerName : string): Promise<Container> {
        const response = await lastValueFrom(
            this.httpService.get(`http://howbe-db-server:3001/container/get?name=${containerName}`),
        );
        return response.data;
    }
}
