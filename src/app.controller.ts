import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { WorkerNode } from './entities/workernode.entity'

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('/checkwnode')
  async checkWorkerNode(@Body() workerNodes: WorkerNode[]): Promise<WorkerNode | null> {
    return this.appService.findMinContainersWorkerNode(workerNodes);
  }
}
