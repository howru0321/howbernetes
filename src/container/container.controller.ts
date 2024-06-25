import { Controller, Get, Post, Delete, Body, Query} from '@nestjs/common';
import { ContainerService } from './container.service';
import { ContainerMetadata } from '../interfaces/metadata.interface'
import { Container } from '../entities/container.entity';

@Controller('container')
export class ContainerController {
    constructor(private readonly containerService: ContainerService) {}

    @Post()
    async create(@Body() body: { name: string, containerMetadata : ContainerMetadata }) {
        const response = await this.containerService.create(body.name, body.containerMetadata);
        return `Successful add ${response.key} to container list`;
    }

    @Delete()
    async delete(@Query('name') containerName){
        const response = await this.containerService.delete(containerName);
        return `Successful remove ${response.key} to container list`;
    }

    @Get('/getall')
    async getAll() : Promise<Container[]> {
      return await this.containerService.getAll();
    }

    @Get('/get')
    async get(@Query('name') containerName) : Promise<Container> {
      return await this.containerService.get(containerName);
    }
}
