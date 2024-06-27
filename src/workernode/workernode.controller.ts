import { Controller, Get, Post, Delete, Body, Query } from '@nestjs/common';
import { WorkernodeService } from './workernode.service';
import { WorkerNodeMetadata } from '../interfaces/metadata.interface'
import { WorkerNode } from '../entities/workernode.entity';

@Controller('workernode')
export class WorkernodeController {
    constructor(private readonly workerNodeService: WorkernodeService) {}

    @Post()
    async create(@Body() body: { name: string, metadata : WorkerNodeMetadata }): Promise<string>{
      
      const response = await this.workerNodeService.create(body.name, body.metadata);
      return `Successful add ${response.key} to worker node list`;
      
    }

    @Delete()
    async delete(@Query('name') workernodetName){
        const response = await this.workerNodeService.delete(workernodetName);
        return `Successful remove ${response.key} to replicaset list`;
    }

    @Get('/getall')
    async getAll() : Promise<WorkerNode[]> {
      return await this.workerNodeService.getAll();
    }

    @Get('/get')
    async get(@Query('name') workernodeName) : Promise<WorkerNode> {
      return await this.workerNodeService.get(workernodeName);
    }
}