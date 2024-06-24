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

    async addContainerInfo(name: string, deployment : string, workernode: string, metadata : string): Promise<string> {
        const response = await lastValueFrom(
            this.httpService.post(
                'http://howbe-db-container:3001/container',
                {
                    name,
                    deployment,
                    workernode,
                    metadata
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
                `http://howbe-db-container:3001/container?name=?${containerName}`
            ),
        );
        return response.data;
    }

    async getAllContainerList(): Promise<Container[]> {
        const response = await lastValueFrom(
            this.httpService.get('http://howbe-db-container:3001/container/getall'),
        );
        return response.data;
    }

    async getContainer(containerName : string): Promise<Container> {
        const response = await lastValueFrom(
            this.httpService.get(`http://howbe-db-container:3001/container/get?name=${containerName}`),
        );
        return response.data;
    }
}
