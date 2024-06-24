import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios'
import { WorkerNode } from '../entities/workernode.entity';

@Injectable()
export class WorkernodeService {
    constructor(
        private readonly httpService: HttpService
    ) {}

    async sendWorkerNodeInfoToDB(name: string, ip: string, port: string) {
        const response = await lastValueFrom(
            this.httpService.post(
                'http://howbe-db-container:3001/workernode',
                {
                    name,
                    ip,
                    port
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


}
