import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios'
import { Pod } from '../entities/pod.entity';
import { PodMetadata } from '../interfaces/metadata.interface'

import { ContainerMetadata } from '../interfaces/metadata.interface'
import { ContainerInfo } from '../interfaces/metadata.interface'

@Injectable()
export class PodService {
    constructor(
        private readonly httpService: HttpService
    ) {}

    async addPodInfo(name: string, deployment : string, workernode: string, containers : number, containerlist : ContainerInfo[], containerMetadataList : ContainerMetadata[] ): Promise<string> {
        const podMetadata : PodMetadata =
        {
            name : name,
            deployment : deployment,
            workernode : workernode,
            containers : containers,
            containerlist : containerlist
        }
        
        const response = await lastValueFrom(
            this.httpService.post(
                'http://howbe-db-server:3001/pod',
                {
                    name,
                    podMetadata,
                    containerMetadataList
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

    async removePodInfo(podName: string): Promise<string> {
        const response = await lastValueFrom(
            this.httpService.delete(
                `http://howbe-db-server:3001/pod?name=${podName}`
            ),
        );
        return response.data;
    }

    async getAllPodList(): Promise<Pod[]> {
        const response = await lastValueFrom(
            this.httpService.get('http://howbe-db-server:3001/pod/getall'),
        );
        return response.data;
    }

    async getPod(podName : string): Promise<Pod> {
        const response = await lastValueFrom(
            this.httpService.get(`http://howbe-db-server:3001/pod/get?name=${podName}`),
        );
        return response.data;
    }
}
