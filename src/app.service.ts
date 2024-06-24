import { Injectable } from '@nestjs/common';
import { WorkerNode } from './entities/workernode.entity'

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  findMinContainersWorkerNode(workerNodes: WorkerNode[]): WorkerNode | null {
    if (workerNodes.length === 0) {
      return null;
    }
  
    let minContainersWorkerNode = workerNodes[0];
  
    for (const workerNode of workerNodes) {
      if (parseInt(workerNode.value.containers) < parseInt(minContainersWorkerNode.value.containers)) {
        minContainersWorkerNode = workerNode;
      }
    }
  
    return minContainersWorkerNode;
  }
}
