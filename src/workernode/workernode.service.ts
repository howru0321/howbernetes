import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios'
import { WorkerNode } from '../entities/workernode.entity';
import { WorkerNodeMetadata } from '../interfaces/workernode.interface'

@Injectable()
export class WorkernodeService {
    constructor(
        private readonly httpService: HttpService
    ) {}


    /**
     * Retrieves a specific worker node by its IP address from the database server.
     * @param ip - The IP address of the worker node.
     * @returns A promise that resolves to the worker node with the specified IP address.
     */
    async getWorkerNode(ip : string) : Promise<WorkerNode>{
        const response = await lastValueFrom(
            this.httpService.get(`http://howbe-db-server:3001/workernode/?key=${ip}`),
        );
        return response.data;
    }
    
    /**
     * Retrieves all worker nodes from the database server.
     * @returns A promise that resolves to a list of all worker nodes.
     */
    async getAllWorkerNode() : Promise<WorkerNode[]>{
        const response = await lastValueFrom(
            this.httpService.get('http://howbe-db-server:3001/workernode/all'),
        );
        return response.data;
    }

    /**
     * Updates a worker node with the given metadata and sends it to the database server.
     * @param ip - The IP address of the worker node.
     * @param port - The port of the worker node.
     * @param containers - The number of containers on the worker node.
     * @param pods - The number of pods on the worker node.
     * @returns A promise that resolves to the response from the database server.
     */
    async updateWorkerNode(ip: string, port: string, containers : number, pods : number):Promise<string> {
        const metadata : WorkerNodeMetadata= {
            port : port,
            containers : containers,
            pods : pods
          }
        const response = await lastValueFrom(
            this.httpService.post(
                'http://howbe-db-server:3001/workernode',
                {
                    ip : ip,
                    metadata : metadata
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
    
    /**
     * Deletes a specific worker node by its IP address from the database server.
     * @param ip - The IP address of the worker node to be deleted.
     * @returns A promise that resolves to the response from the database server.
     */
    async deleteWorkernode(ip: string): Promise<string> {
        const response = await lastValueFrom(
            this.httpService.delete(
                `http://howbe-db-server:3001/workernode?name=${ip}`
            ),
        );
        return response.data;
    }
}
