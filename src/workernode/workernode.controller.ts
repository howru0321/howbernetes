import { Controller, Post, Body } from '@nestjs/common';
import { WorkernodeService } from './workernode.service';

@Controller('workernode')
export class WorkernodeController {
    constructor(private readonly workerNodeService: WorkernodeService) {}

    @Post('/create')
    async create(@Body() body: { name: string; metadata: any }) {
        await this.workerNodeService.create(body.name, body.metadata);
        return 'good!!!';
  }
}
