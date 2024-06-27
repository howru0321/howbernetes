import { Controller, Get, Post, Patch, Delete, Body, Query } from '@nestjs/common';
import { PodService } from './pod.service';
import { PodMetadata } from '../interfaces/metadata.interface'
import { Pod } from '../entities/pod.entity';
//import { ContainerMetadata } from '../interfaces/metadata.interface'

@Controller('pod')
export class PodController {
    constructor(private readonly podService: PodService) {}

    @Post()
    async create(@Body() body: { podId: string, podMetadata : PodMetadata}) {
        const response = await this.podService.create(body.podId, body.podMetadata);
        return `Successful add ${response.key} to pod list`;
    }

    @Delete()
    async delete(@Query('id') podId){
        const response = await this.podService.delete(podId);
        return `Successful remove ${response.key} to pod list`;
    }

    @Get('/getall')
    async getAll() : Promise<Pod[]> {
      return await this.podService.getAll();
    }

    @Get('/get')
    async get(@Query('name') podName) : Promise<Pod> {
      return await this.podService.get(podName);
    }

}
