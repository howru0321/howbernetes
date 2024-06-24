import { Controller, Get, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ContainerService } from './container.service';
import { ContainerMetadata } from '../interfaces/metadata.interface'
import { Container } from '../entities/container.entity';

@Controller('container')
export class ContainerController {
    constructor(private readonly containerService: ContainerService) {}

    @Post()
    async create(@Body() body: { name: string; deployment: string, workernode: string, metadata : string }): Promise<string> {
        const containerMetadata : ContainerMetadata =
        {
            name : body.name,
            deployment : body.deployment,
            workernode : body.workernode,
            metadata : body.metadata
        }
        const response = await this.containerService.create(body.name, containerMetadata);
        return `Successful add ${response.key} to container list`;
    }

    @Get('/getall')
    async getAll() : Promise<Container[]> {
      return await this.containerService.getAll();
    }
}
