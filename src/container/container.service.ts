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
