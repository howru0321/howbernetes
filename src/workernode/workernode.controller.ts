import { Controller, Get, Post, Delete, Body, Query } from '@nestjs/common';
import { WorkernodeService } from './workernode.service';
import { WorkerNodeMetadata } from '../interfaces/workernode.interface'
import { WorkerNode } from '../entities/workernode.entity';

@Controller('workernode')
export class WorkernodeController {
    constructor(private readonly workerNodeService: WorkernodeService) {}

    /**
     * Retrieves a specific worker node by its IP address.
     * @param ip - The IP address of the worker node.
     * @returns The worker node with the specified IP address.
     */
    @Get()
    async get(@Query('key') ip) : Promise<WorkerNode> {
      return await this.workerNodeService.get(ip);
    }

    /**
     * Retrieves all worker nodes.
     * @returns A list of all worker nodes.
     */
    @Get('/all')
    async getAll() : Promise<WorkerNode[]> {
      return await this.workerNodeService.getAll();
    }

    /**
     * Adds a new worker node.
     * @param body - The body containing the IP address and metadata of the worker node.
     * @returns A message indicating the result of the addition.
     */
    @Post()
    async create(@Body() body: { ip: string, metadata : WorkerNodeMetadata }): Promise<string>{
      const response = await this.workerNodeService.create(body.ip, body.metadata);
      return `Successful add ${response.key} to worker node list`;
    }
    
    /**
     * Deletes a specific worker node by its IP address.
     * @param ip - The IP address of the worker node to be deleted.
     * @returns A message indicating the result of the deletion.
     */
    @Delete()
    async delete(@Query('key') ip){
        const response = await this.workerNodeService.delete(ip);
        return `Successful remove ${response.key} to worker node list`;
    }
}