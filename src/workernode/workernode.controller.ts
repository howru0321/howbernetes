import { Controller, Get, Post, Delete, Query, Body } from '@nestjs/common';

import { WorkerNode } from '../entities/workernode.entity'
import { WorkernodeService } from './workernode.service'

@Controller('workernode')
export class WorkernodeController {
    constructor(
        private readonly workernodeService: WorkernodeService,
      ) {}

  /**
   * Retrieves a specific worker node by its IP address.
   * @param ip - The IP address of the worker node.
   * @returns The worker node with the specified IP address.
   */
  @Get()
  async getWorkerNode(@Query('key') ip : string): Promise<WorkerNode> {
    return this.workernodeService.getWorkerNode(ip);
  }

  /**
   * Retrieves all worker nodes.
   * @returns A list of all worker nodes.
   */
  @Get('/all')
  async getAllWorkerNode(): Promise<WorkerNode[]> {
    return this.workernodeService.getAllWorkerNode();
  }

  /**
   * Adds a new worker node if it does not already exist.
   * @param body - The body containing the IP address and port of the worker node.
   * @returns A message indicating the result of the addition or the worker node details if added successfully.
   */
  @Post()
  async addWorkerNode(@Body() body: {ip: string, port: string}) {
    const {ip, port} = body;
    
    const workernodeInfo : WorkerNode = await this.workernodeService.getWorkerNode(ip);
    if(workernodeInfo){
      return `${ip} is already exist in worker node list.`
    }
    return this.workernodeService.updateWorkerNode(ip, port, 0, 0);
  }

  /**
   * Deletes a worker node if it is not currently working.
   * @param ip - The IP address of the worker node to be deleted.
   * @returns A message indicating the result of the deletion.
   */
  @Delete()
  async deleteWorkerNode(@Query('key') ip :string) {
    const workernodeInfo : WorkerNode = await this.workernodeService.getWorkerNode(ip);
    if(workernodeInfo.value.pods !== 0){
      return `${ip} is working! You cannot delete this worker node.`
    }
    return this.workernodeService.deleteWorkernode(ip);
  }
}
