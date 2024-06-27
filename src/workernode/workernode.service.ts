import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios'
import { WorkerNode } from '../entities/workernode.entity';
import { WorkerNodeMetadata } from '../interfaces/metadata.interface'

@Injectable()
export class WorkernodeService {
    constructor(
        private readonly httpService: HttpService
    ) {}

    async sendWorkerNodeInfoToDB(name: string, ip: string, port: string, containers : number, pods : number):Promise<string> {
        const metadata : WorkerNodeMetadata= {
            name : name,
            ip : ip,
            port : port,
            containers : containers,
            pods : pods
          }
        const response = await lastValueFrom(
            this.httpService.post(
                'http://howbe-db-server:3001/workernode',
                {
                    name,
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

    
    async getAllWorkerNodeInfo() : Promise<WorkerNode[]>{
        const response = await lastValueFrom(
            this.httpService.get('http://howbe-db-server:3001/workernode/getall'),
        );
        return response.data;
    }

    async getWorkerNode(workernodeName : string) : Promise<WorkerNode>{
        const response = await lastValueFrom(
            this.httpService.get(`http://howbe-db-server:3001/workernode/get?name=${workernodeName}`),
        );
        return response.data;
    }

    async checkWorkerNodeInfo(workerNodes : WorkerNode[]) : Promise<WorkerNode>{
        const response = await lastValueFrom(
            this.httpService.post(
                'http://howbe-scheduler-server:3002/checkwnode',
                workerNodes,
                {
                    headers: { 'Content-Type': 'application/json' },
                },
            ),
        );
        return response.data;
    }

    async removeWorkernode(workernodeName: string): Promise<string> {
        const response = await lastValueFrom(
            this.httpService.delete(
                `http://howbe-db-server:3001/workernode?name=${workernodeName}`
            ),
        );
        return response.data;
    }



}
