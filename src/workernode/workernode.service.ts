import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios'
import { WorkerNode } from '../entities/workernode.entity';

@Injectable()
export class WorkernodeService {
    constructor(
        private readonly httpService: HttpService
    ) {}

    async sendWorkerNodeInfoToDB(name: string, ip: string, port: string, containers : number, pods : number, deployments : number):Promise<string> {
        const response = await lastValueFrom(
            this.httpService.post(
                'http://howbe-db-container:3001/workernode',
                {
                    name,
                    ip,
                    port,
                    containers,
                    pods,
                    deployments
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
            this.httpService.get('http://howbe-db-container:3001/workernode/getall'),
        );
        return response.data;
    }

    async getWorkerNodeInfo(workernodeName : string) : Promise<WorkerNode>{
        const response = await lastValueFrom(
            this.httpService.get(`http://howbe-db-container:3001/workernode/get?name=${workernodeName}`),
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


}
