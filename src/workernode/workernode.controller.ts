import { Controller, Get, Post, Body } from '@nestjs/common';
import { WorkernodeService } from './workernode.service';
import { Metadata } from '../interfaces/metadata.interface'

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

      return metadata;
      
        //const response = await this.workerNodeService.create(body.name, metadata);
        //return `Successful add ${response.key}`;
    }

    @Get('/getall')
    async getAll(){
      return await this.workerNodeService.getAll();
    }
}