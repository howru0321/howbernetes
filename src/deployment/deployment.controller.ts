import { Controller, Get, Post, Delete, Body, Query } from '@nestjs/common';
import { DeploymentService } from './deployment.service';
import { DeploymentMetadata } from '../interfaces/metadata.interface'
import { Deployment } from '../entities/deployment.entity';

@Controller('deployment')
export class DeploymentController {
    constructor(private readonly deploymentService: DeploymentService) {}

    @Post()
    async create(@Body() body: { deploymentName: string, deploymentMetadata : DeploymentMetadata}) {
        const response = await this.deploymentService.create(body.deploymentName, body.deploymentMetadata);
        return `Successful add ${response.key} to deployment list`;
    }

    @Delete()
    async delete(@Query('name') deploymentName){
        const response = await this.deploymentService.delete(deploymentName);
        return `Successful remove ${response.key} to deployment list`;
    }

    @Get('/getall')
    async getAll() : Promise<Deployment[]> {
      return await this.deploymentService.getAll();
    }

    @Get('/get')
    async get(@Query('name') deploymentName) : Promise<Deployment> {
      return await this.deploymentService.get(deploymentName);
    }
}
