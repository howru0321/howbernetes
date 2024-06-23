import { Controller, Get, Post, Body } from '@nestjs/common';
import { ContainerService } from './container.service';

@Controller('container')
export class ContainerController {
    constructor(private readonly containerService: ContainerService) {}

    @Post('/create')
    create(@Body() body: { name: string; metadata: string }) {
        return this.containerService.create(body.name, body.metadata);
    }
}
