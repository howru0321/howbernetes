import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios'
import { Pod } from '../entities/pod.entity';
import { PodMetadata, Label } from '../interfaces/metadata.interface'

import { ContainerMetadata } from '../interfaces/metadata.interface'
import { ContainerIdInfo } from '../interfaces/metadata.interface'

@Injectable()
export class PodService {
    constructor(
        private readonly httpService: HttpService
    ) {}

    async InitPodState(podId : string, podName: string, podLabels : Label[], workernodeName: string, containerIdList : ContainerIdInfo[]): Promise<string> {
        const podMetadata : PodMetadata =
        {
            name : podName,
            podLabels : podLabels,
            workernode : workernodeName,
            containers : 0,
            containeridlist : containerIdList
        }
        
        const response = await lastValueFrom(
            this.httpService.post(
                'http://howbe-db-server:3001/pod',
                {
                    id : podId,
                    podMetadata : podMetadata
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

    async updatePodState(podId : string, podMetadata : PodMetadata): Promise<string> {
        const response = await lastValueFrom(
            this.httpService.post(
                'http://howbe-db-server:3001/pod',
                {
                    podId : podId,
                    podMetadata : podMetadata
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

    async addPodInfo(id : string, name: string, podLabels : Label[], workernode: string, containers : number, containeridlist : ContainerIdInfo[], containerMetadataList : ContainerMetadata[] ): Promise<string> {
        const podMetadata : PodMetadata =
        {
            name : name,
            podLabels : podLabels,
            workernode : workernode,
            containers : containers,
            containeridlist : containeridlist
        }
        
        const response = await lastValueFrom(
            this.httpService.post(
                'http://howbe-db-server:3001/pod',
                {
                    id,
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

    async removePod(podId: string): Promise<string> {
        const response = await lastValueFrom(
            this.httpService.delete(
                `http://howbe-db-server:3001/pod?id=${podId}`
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
