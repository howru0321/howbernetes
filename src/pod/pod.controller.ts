import { Controller, Post, Body } from '@nestjs/common';
import { PodService } from './pod.service';
import { PodMetadata } from '../interfaces/metadata.interface'
import { Pod } from '../entities/pod.entity';

@Controller('pod')
export class PodController {
    constructor(private readonly podService: PodService) {}

    @Post()
    async create(@Body() body: { name: string, podMetadata : PodMetadata }) {
        const response = await this.podService.create(body.name, body.podMetadata);
        return `Successful add ${response.key} to pod list`;
    }

}
