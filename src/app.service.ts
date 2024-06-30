import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios'
import { v4 as uuidv4 } from 'uuid';

import { WorkerNode } from './entities/workernode.entity';
import { WorkernodeService } from './workernode/workernode.service'


@Injectable()
export class AppService {
  constructor(
    private readonly httpService: HttpService,
    private readonly workernodeService : WorkernodeService
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async runContainerWithImage(workernodeIp : string, workernodePort : string, image : string):Promise<string> {
    const response = await lastValueFrom(
        this.httpService.post(
            `http://${workernodeIp}:${workernodePort}/run-container`,
            {
              image
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        ),
    );
    return response.data;
}
  async removeContainer(workernodeIp : string, workernodePort : string, containerId : string):Promise<string> {
    const response = await lastValueFrom(
        this.httpService.post(
            `http://${workernodeIp}:${workernodePort}/remove-container`,
            {
              containerId
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        ),
    );
    return response.data;
  }

  /**
   * This function returns the worker node with the minimum number of containers.
   * It first retrieves information about all worker nodes from ETCD,
   * then it uses the scheduler service to find the worker node with the fewest containers.
   */
  private async getMinContainersWorkerNodeFromScheduler() : Promise<WorkerNode> {
    /*API to ETCD : Get all worker nodes information from ETCD*/
    const allWorkerNodeInfo : WorkerNode[] = await this.workernodeService.getAllWorkerNode();
    /*API to SCHEDULER : Use scheduler service to find the worker node with the minimum number of containers*/
    const minContainersWorkerNode : WorkerNode = await this.workernodeService.checkWorkerNodeInfo(allWorkerNodeInfo);
    
    return minContainersWorkerNode
  }

  /**
   * This function generates a UUID that is not already present in the provided list of existing UUIDs.
   * It continuously generates a new UUID until it finds one that is not in the existingUUIDs array.
   * @param existingUUIDs - An array of UUIDs that already exist and should be avoided.
   * @returns A promise that resolves to a new, unique UUID.
   */
  private async generateUUID(existingUUIDs: string[]): Promise<string> {
    let newUUID: string;
    do {
      newUUID = await uuidv4();
    } while (existingUUIDs.includes(newUUID));
    
    return newUUID;
  }
}
