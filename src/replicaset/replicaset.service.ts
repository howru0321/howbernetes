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

    async updateReplicasetState(replicasetName: string, replicas : number, matchLabels : Label[], podIdList : string[], podTemplate : PodTemplate): Promise<string> {
        const replicasetMetadata : ReplicasetMetadata =
        {
            name : replicasetName,
            replicas : replicas,
            matchlabel : matchLabels,
            podidlist : podIdList,
            podtemplate : podTemplate
        }
        
        const response = await lastValueFrom(
            this.httpService.post(
                'http://howbe-db-server:3001/replicaset',
                {
                    replicasetName : replicasetName,
                    replicasetMetadata : replicasetMetadata
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

    async removeReplicase(replicasetName: string): Promise<string> {
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
