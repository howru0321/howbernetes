import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios'
import { Replicaset } from '../entities/replicaset.entity'
import { ReplicasetMetadata } from '../interfaces/metadata.interface'
import { PodTemplate } from '../interfaces/metadata.interface'

import { PodMetadata } from '../interfaces/metadata.interface'

@Injectable()
export class ReplicasetService {
    constructor(
        private readonly httpService: HttpService
    ) {}

    async addReplicasetInfo(name: string, replicas : number, podidlist : string[], podtemplate : PodTemplate): Promise<string> {
        const replicasetMetadata : ReplicasetMetadata =
        {
            name : name,
            replicas : replicas,
            podidlist : podidlist,
            podtemplate : podtemplate
        }
        
        const response = await lastValueFrom(
            this.httpService.post(
                'http://howbe-db-server:3001/replicaset',
                {
                    name,
                    replicasetMetadata
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
