import { Controller, Get, Post, Delete, Query, Body, UseInterceptors, UploadedFile} from '@nestjs/common';
import { AppService } from './app.service';
import { WorkernodeService } from './workernode/workernode.service';
import { ContainerService } from './container/container.service';
import { PodService } from './pod/pod.service'
import * as yaml from 'js-yaml';
import { WorkerNode } from './entities/workernode.entity';
import { Container } from './entities/container.entity';
import { CreatePodDto } from './create-pod.dto';
import { ContainerInfo } from './create-pod.dto';
import { ContainerMetadata } from './interfaces/metadata.interface';
import { Pod } from './entities/pod.entity';


@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly workernodeService: WorkernodeService,
    private readonly containerService: ContainerService,
    private readonly podService: PodService
  ) {}

  private async getMinContainersWorkerNodeFromScheduler() : Promise<WorkerNode> {
    /*API to ETCD : Get all worker nodes information from ETCD*/
    const allWorkerNodeInfo : WorkerNode[] = await this.workernodeService.getAllWorkerNodeInfo();
    /*API to SCHEDULER : Use scheduler service to find the worker node with the minimum number of containers*/
    const minContainersWorkerNode : WorkerNode = await this.workernodeService.checkWorkerNodeInfo(allWorkerNodeInfo);
    
    return minContainersWorkerNode
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('/deploy')
  deploy(@Body() body: { data: string }): string {
    try {
      const config = yaml.load(body.data);
      console.log('Received deployment configuration:', config);
      // 여기에 실제 배포 로직을 추가합니다.
      return 'Deployment configuration received successfully';
    } catch (error) {
      console.error('Error parsing the YAML file:', error);
      throw new Error('Invalid YAML file');
    }
  }

  @Post('/run')
  async runContainer(@Body() body: {container: string, image: string }) {
    const { container, image } = body;
    
    const minContainersWorkerNode : WorkerNode = await this.getMinContainersWorkerNodeFromScheduler();
    
    const workernodeName : string = minContainersWorkerNode.key
    const workernodeIp : string = minContainersWorkerNode.value.ip
    const workernodePort : string = minContainersWorkerNode.value.port
    let workernodeContainers : number = minContainersWorkerNode.value.containers
    const workernodePods : number = minContainersWorkerNode.value.pods
    const workernodeDeployments : number = minContainersWorkerNode.value.deployments

    /*API to kubelet : Run Container*/
    const metadata = await this.appService.runContainerWithImage(workernodeIp, workernodePort, container, image);
    
    /*API to ETCD : Update the selected worker node's container count in ETCD*/
    workernodeContainers=workernodeContainers+1;
    await this.workernodeService.sendWorkerNodeInfoToDB(workernodeName, workernodeIp, workernodePort, workernodeContainers, workernodePods, workernodeDeployments);

    /*API to ETCD : Store the container information and bind it to the worker node in the ETCD*/
    await this.containerService.addContainerInfo(container, null, null, workernodeName, metadata )

    return `${container}(container name) is running in ${workernodeName}(worker-node name)`;
  }

  @Post('/remove')
  async removeContainer(@Body() body: {container: string}) {
    const { container }= body;

    /*API to ETCD : Get container information from ETCD*/
    const containerInfo : Container = await this.containerService.getContainer(container);

    const workernodeName = containerInfo.value.workernode;
    
    /*API to ETCD : Get worker nodes information which was binding this container from ETCD*/
    const WorkerNodeInfo : WorkerNode = await this.workernodeService.getWorkerNodeInfo(workernodeName);
    
    const workernodeIp : string = WorkerNodeInfo.value.ip
    const workernodePort : string = WorkerNodeInfo.value.port
    let workernodeContainers : number = WorkerNodeInfo.value.containers
    const workernodePods : number = WorkerNodeInfo.value.pods
    const workernodeDeployments : number = WorkerNodeInfo.value.deployments

    /*API to kubelet : Remove container*/
    await this.appService.removeContainer(workernodeIp, workernodePort, container);

    /*API to ETCD : Update the worker node's container count in ETCD*/
    workernodeContainers=workernodeContainers-1;
    await this.workernodeService.sendWorkerNodeInfoToDB(workernodeName, workernodeIp, workernodePort, workernodeContainers, workernodePods, workernodeDeployments);

    /*API to ETCD : Store the container information and bind it to the worker node in the ETCD*/
    await this.containerService.removeContainerInfo(container)

    return `${container}(container name) is removed in ${workernodeName}(worker-node name)`;
  }

  @Post('/create')
  async createPod(@Body() body : CreatePodDto){
    const podName : string = body.podName;
    const containerInfoList : ContainerInfo[] = body.containerInfolist;

    const minContainersWorkerNode : WorkerNode = await this.getMinContainersWorkerNodeFromScheduler();
    
    const workernodeName : string = minContainersWorkerNode.key
    const workernodeIp : string = minContainersWorkerNode.value.ip
    const workernodePort : string = minContainersWorkerNode.value.port
    let workernodeContainers : number = minContainersWorkerNode.value.containers
    let workernodePods : number = minContainersWorkerNode.value.pods
    const workernodeDeployments : number = minContainersWorkerNode.value.deployments

    let containerList : ContainerMetadata[] = [];
    for(var containerInfo of containerInfoList){
      const containerName = containerInfo.name;
      const ImageName = containerInfo.image;

      /*API to kubelet : Run Container*/
      const metadata = await this.appService.runContainerWithImage(workernodeIp, workernodePort, containerName, ImageName);

      const containerMetadata : ContainerMetadata = {
        name : containerName,
        pod : podName,
        deployment : null,
        workernode : workernodeName,
        metadata : metadata
      }
      containerList.push(containerMetadata);
    }
    
    /*API to ETCD : Update the selected worker node's container count in ETCD*/
    const containernumber : number = containerInfoList.length;
    workernodeContainers=workernodeContainers+containernumber;
    workernodePods=workernodePods+1;
    await this.workernodeService.sendWorkerNodeInfoToDB(workernodeName, workernodeIp, workernodePort, workernodeContainers, workernodePods, workernodeDeployments);

    /*API to ETCD : Store the container information and bind it to the worker node in the ETCD*/
    await this.podService.addPodInfo(podName, null, workernodeName, containernumber, containerList)

    return `${podName}(container name) is running in ${workernodeName}(worker-node name)`;
  }

  @Delete('/delete')
    async deletePod(@Query('name') podName) {

    /*API to ETCD : Get container information from ETCD*/
    const podInfo : Pod = await this.podService.getPod(podName);
    const workernodeName = podInfo.value.workernode;
    
    /*API to ETCD : Get worker nodes information which was binding this container from ETCD*/
    const WorkerNodeInfo : WorkerNode = await this.workernodeService.getWorkerNodeInfo(workernodeName);
    
    const workernodeIp : string = WorkerNodeInfo.value.ip
    const workernodePort : string = WorkerNodeInfo.value.port
    let workernodeContainers : number = WorkerNodeInfo.value.containers
    let workernodePods : number = WorkerNodeInfo.value.pods
    const workernodeDeployments : number = WorkerNodeInfo.value.deployments

    /*API to kubelet : Remove container*/
    const containerList : ContainerMetadata[] = podInfo.value.containerlist
    for(var container of containerList){
      const containerName = container.name
      await this.appService.removeContainer(workernodeIp, workernodePort, containerName);
    }


    /*API to ETCD : Update the worker node's container count in ETCD*/
    const containerNumber : number = containerList.length;
    workernodeContainers=workernodeContainers-containerNumber;
    workernodePods=workernodePods-1
    await this.workernodeService.sendWorkerNodeInfoToDB(workernodeName, workernodeIp, workernodePort, workernodeContainers, workernodePods, workernodeDeployments);

    /*API to ETCD : Store the container information and bind it to the worker node in the ETCD*/
    await this.podService.removePodInfo(podName)

    return `${podName}(pod name) is removed in ${workernodeName}(worker-node name)`;
  }

  @Post('/worker')
  async addWorkerNodeInfo(@Body() body: {name: string, ip: string, port: string}) {
    const {name, ip, port} = body;
    
    return this.workernodeService.sendWorkerNodeInfoToDB(name, ip, port, 0, 0, 0);
  }

  @Get('/container/getall')
  async getContainerList(): Promise<Container[]> {
    return this.containerService.getAllContainerList();
  }

}
