import { Controller, Get, Post, Body } from '@nestjs/common';
import { ContainerService } from './container.service';
import { Metadata } from '../interfaces/metadata.interface'

@Controller('container')
export class ContainerController {
    constructor(private readonly containerService: ContainerService) {}

    @Post('/create')
    create(@Body() body: { name: string; metadata: Metadata }) {
        return this.containerService.create(body.name, body.metadata);
    }
}
