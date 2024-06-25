import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios'
import { Pod } from '../entities/pod.entity';
import { PodMetadata } from '../interfaces/metadata.interface'

import { ContainerMetadata } from '../interfaces/metadata.interface'

@Injectable()
export class PodService {
    constructor(
        private readonly httpService: HttpService
    ) {}

    async addPodInfo(name: string, deployment : string, workernode: string, containers : number, containerlist : ContainerMetadata[] ): Promise<string> {
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
                    podMetadata
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
