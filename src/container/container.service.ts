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

    async updateContainerState(containerId: string, containerName : string, imageName : string, workernodeName : string): Promise<string> {
        const containerMetadata : ContainerMetadata =
        {
            name : containerName,
            image : imageName,
            workernode : workernodeName
        }
        
        const response = await lastValueFrom(
            this.httpService.post(
                'http://howbe-db-server:3001/container',
                {
                    containerId : containerId,
                    containerMetadata : containerMetadata
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

    async removeContainer(containerId: string): Promise<string> {
        const response = await lastValueFrom(
            this.httpService.delete(
                `http://howbe-db-server:3001/container?id=${containerId}`
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
