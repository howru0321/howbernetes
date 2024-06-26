import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios'
import { Replicaset } from '../entities/replicaset.entity'
import { ReplicasetMetadata, Label } from '../interfaces/metadata.interface'
import { PodTemplate } from '../interfaces/metadata.interface'

import { PodMetadata } from '../interfaces/metadata.interface'

@Injectable()
export class ReplicasetService {
    constructor(
        private readonly httpService: HttpService
    ) {}

    async addReplicasetInfo(name: string, replicas : number, matchLabels : Label[], podidlist : string[], podtemplate : PodTemplate): Promise<string> {
        const replicasetMetadata : ReplicasetMetadata =
        {
            name : name,
            replicas : replicas,
            matchlabel : matchLabels,
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

    async removeReplicasetInfo(replicasetName: string): Promise<string> {
        const response = await lastValueFrom(
            this.httpService.delete(
                `http://howbe-db-server:3001/replicaset?name=${replicasetName}`
            ),
        );
        return response.data;
    }

    async getAllReplicasetList(): Promise<Replicaset[]> {
        const response = await lastValueFrom(
            this.httpService.get('http://howbe-db-server:3001/replicaset/getall'),
        );
        return response.data;
    }

    async getReplicaset(replicasetName : string): Promise<Replicaset> {
        const response = await lastValueFrom(
            this.httpService.get(`http://howbe-db-server:3001/replicaset/get?name=${replicasetName}`),
        );
        return response.data;
    }
}
