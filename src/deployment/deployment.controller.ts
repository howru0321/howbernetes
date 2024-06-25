import { Controller, Get, Post, Delete, Body, Query } from '@nestjs/common';
import { DeploymentService } from './deployment.service';
import { DeploymentMetadata } from '../interfaces/metadata.interface'
import { Deployment } from '../entities/deployment.entity';

@Controller('deployment')
export class DeploymentController {
    constructor(private readonly deploymentService: DeploymentService) {}

    @Post()
    async create(@Body() body: { name: string, deploymentMetadata : DeploymentMetadata}) {
        const response = await this.deploymentService.create(body.name, body.deploymentMetadata);
        return `Successful add ${response.key} to pod list`;
    }

    @Delete()
    async delete(@Query('name') deploymentName){
        const response = await this.deploymentService.delete(deploymentName);
        return `Successful remove ${response.key} to pod list`;
    }

    @Get('/getall')
    async getAll() : Promise<Deployment[]> {
      return await this.deploymentService.getAll();
    }

    @Get('/get')
    async get(@Query('name') podName) : Promise<Deployment> {
      return await this.deploymentService.get(podName);
    }

}
