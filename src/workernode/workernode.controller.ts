import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { WorkernodeService } from './workernode.service';
import { WorkerNodeMetadata } from '../interfaces/metadata.interface'
import { WorkerNode } from '../entities/workernode.entity';

@Controller('workernode')
export class WorkernodeController {
    constructor(private readonly workerNodeService: WorkernodeService) {}

    @Post()
    async create(@Body() body: { name: string, ip: string, port: string, containers: string }): Promise<string>{
      const metadata : WorkerNodeMetadata= {
        name : body.name,
        ip : body.ip,
        port : body.port,
        containers : body.containers
      }
      
      const response = await this.workerNodeService.create(body.name, metadata);
      return `Successful add ${response.key} to worker node list`;
      
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