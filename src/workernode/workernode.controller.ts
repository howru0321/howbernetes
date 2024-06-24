import { Controller, Get, Post, Body } from '@nestjs/common';
import { WorkernodeService } from './workernode.service';
import { Metadata } from '../interfaces/metadata.interface'
import { WorkerNode } from '../entities/workernode.entity';

@Controller('workernode')
export class WorkernodeController {
    constructor(private readonly workerNodeService: WorkernodeService) {}

    @Post()
    async create(@Body() body: { name: string, ip: string, port: string }) {
      const metadata : Metadata= {
        name : body.name,
        ip : body.ip,
        port : body.port
      }
      
        const response = await this.workerNodeService.create(body.name, metadata);
        return `Successful add ${response.key}`;
    }

    @Get('/getall')
    async getAll() : Promise<WorkerNode[]> {
      return await this.workerNodeService.getAll();
    }
}