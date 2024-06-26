import { Controller, Get, Post, Delete, Body, Query } from '@nestjs/common';
import { ReplicasetService } from './replicaset.service';
import { ReplicasetMetadata } from '../interfaces/metadata.interface'
import { Replicaset } from '../entities/replicaset.entity';

@Controller('replicaset')
export class ReplicasetController {
    constructor(private readonly replicasetService: ReplicasetService) {}

    @Post()
    async create(@Body() body: { name: string, replicasetMetadata : ReplicasetMetadata}) {
        const response = await this.replicasetService.create(body.name, body.replicasetMetadata);
        return `Successful add ${response.key} to pod list`;
    }

    @Delete()
    async delete(@Query('name') replicasetName){
        const response = await this.replicasetService.delete(replicasetName);
        return `Successful remove ${response.key} to pod list`;
    }

    @Get('/getall')
    async getAll() : Promise<Replicaset[]> {
      return await this.replicasetService.getAll();
    }

    @Get('/get')
    async get(@Query('name') podName) : Promise<Replicaset> {
      return await this.replicasetService.get(podName);
    }

}
