import { Controller, Get, Post, Delete, Query, Body, UseInterceptors, UploadedFile} from '@nestjs/common';
import { AppService } from './app.service';
import { WorkernodeService } from './workernode/workernode.service';
import { ContainerService } from './container/container.service';
import { PodService } from './pod/pod.service'
import { WorkerNode } from './entities/workernode.entity';
import { Container } from './entities/container.entity';
import { CreatePodDto } from './interfaces/metadata.interface';
import { CreateDeployDto } from './interfaces/metadata.interface'
import { ContainerInfo } from './interfaces/metadata.interface';
import { ContainerMetadata } from './interfaces/metadata.interface';
import { Pod } from './entities/pod.entity';
import { ContainerIdInfo } from './interfaces/metadata.interface'
import { v4 as uuidv4 } from 'uuid';
import { DeploymentService } from './deployment/deployment.service'
import { PodTemplate } from './interfaces/metadata.interface'


@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly workernodeService: WorkernodeService,
    private readonly containerService: ContainerService,
    private readonly podService: PodService,
    private readonly deploymentService: DeploymentService
  ) {}

  private async getMinContainersWorkerNodeFromScheduler() : Promise<WorkerNode> {
    /*API to ETCD : Get all worker nodes information from ETCD*/
    const allWorkerNodeInfo : WorkerNode[] = await this.workernodeService.getAllWorkerNodeInfo();
    /*API to SCHEDULER : Use scheduler service to find the worker node with the minimum number of containers*/
    const minContainersWorkerNode : WorkerNode = await this.workernodeService.checkWorkerNodeInfo(allWorkerNodeInfo);
    
    return minContainersWorkerNode
  }

  private async savePodInfoInDB(podId : string, containerlist : ContainerIdInfo[], workernodeContainers : number, workernodePods : number, workernodeName : string, workernodeIp : string, workernodePort : string, podName : string, containerMetadataList : ContainerMetadata[], deployName : string){
    /*API to ETCD : Update the selected worker node's container count in ETCD*/
    const containernumber : number = containerlist.length;
    workernodeContainers=workernodeContainers+containernumber;
    workernodePods=workernodePods+1;
    await this.workernodeService.sendWorkerNodeInfoToDB(workernodeName, workernodeIp, workernodePort, workernodeContainers, workernodePods);

    /*API to ETCD : Store the container information and bind it to the worker node in the ETCD*/
    await this.podService.addPodInfo(podId, podName, deployName, workernodeName, containernumber, containerlist, containerMetadataList)
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('/create/deploy')
  async createDeploy(@Body() body: CreateDeployDto) {
    const deployName : string = body.deployName
    const replicas : number = body.replicas
    const podName : string = body.podInfo.podName
    const containerlist : ContainerInfo[] = body.podInfo.containerInfolist

    let podIdList : string[] = []
    const existingUUIDs = new Set<string>();
    for(let i=0;i<replicas;i++){
      const minContainersWorkerNode : WorkerNode = await this.getMinContainersWorkerNodeFromScheduler();
    
      const workernodeName : string = minContainersWorkerNode.key
      const workernodeIp : string = minContainersWorkerNode.value.ip
      const workernodePort : string = minContainersWorkerNode.value.port
      let workernodeContainers : number = minContainersWorkerNode.value.containers
      let workernodePods : number = minContainersWorkerNode.value.pods
      
      let containerMetadataList : ContainerMetadata[] = [];
      let containerIdList : ContainerIdInfo[] = [];
      for(var containerInfo of containerlist){
        const containerName = containerInfo.name;
        const ImageName = containerInfo.image;

        /*API to kubelet : Run Container*/
        const containerId = await this.appService.runContainerWithImage(workernodeIp, workernodePort, ImageName);

        const containerMetadata : ContainerMetadata = {
          id : containerId,
          name : containerName,
          image : ImageName,
          pod : podName,
          deployment : null,
          workernode : workernodeName
        }
        containerMetadataList.push(containerMetadata);

        const containerIdInfo : ContainerIdInfo = {
          id : containerId,
          metadata : containerInfo
        }
        containerIdList.push(containerIdInfo)
      }
      
      let newUUID: string;
      do {
          newUUID = uuidv4();
      } while (existingUUIDs.has(newUUID));

      existingUUIDs.add(newUUID);
      const podId : string = podName+newUUID;
      podIdList.push(podId);

      await this.savePodInfoInDB(podId, containerIdList, workernodeContainers, workernodePods, workernodeName, workernodeIp, workernodePort, podName, containerMetadataList, deployName)
    }

    const podTemplate : PodTemplate = {
      name : podName,
      containerlist : containerlist
    }
    await this.deploymentService.addDeployInfo(deployName, replicas, podIdList, podTemplate)

    return `${deployName}(deploy name) is running`
  }

  @Post('/create/pod')
  async createPod(@Body() body : CreatePodDto){
    const podName : string = body.podName;
    const containerlist : ContainerInfo[] = body.containerInfolist;

    const minContainersWorkerNode : WorkerNode = await this.getMinContainersWorkerNodeFromScheduler();
    
    const workernodeName : string = minContainersWorkerNode.key
    const workernodeIp : string = minContainersWorkerNode.value.ip
    const workernodePort : string = minContainersWorkerNode.value.port
    let workernodeContainers : number = minContainersWorkerNode.value.containers
    let workernodePods : number = minContainersWorkerNode.value.pods
    
    let containerMetadataList : ContainerMetadata[] = [];
    let containerIdList : ContainerIdInfo[] = [];
    for(var containerInfo of containerlist){
      const containerName = containerInfo.name;
      const ImageName = containerInfo.image;

      /*API to kubelet : Run Container*/
      const containerId = await this.appService.runContainerWithImage(workernodeIp, workernodePort, ImageName);

      const containerMetadata : ContainerMetadata = {
        id : containerId,
        name : containerName,
        image : ImageName,
        pod : podName,
        deployment : null,
        workernode : workernodeName
      }
      containerMetadataList.push(containerMetadata);

      const containerIdInfo : ContainerIdInfo = {
        id : containerId,
        metadata : containerInfo
      }
      containerIdList.push(containerIdInfo)
    }
    
    let newUUID: string = uuidv4();
    const podId = podName+newUUID;
    await this.savePodInfoInDB(podId, containerIdList, workernodeContainers, workernodePods, workernodeName, workernodeIp, workernodePort, podName, containerMetadataList, null)

    return `${podName}(container name) is running in ${workernodeName}(worker-node name)`;
  }

  @Delete('/delete')
    async deletePod(@Query('name') podId) {

    /*API to ETCD : Get container information from ETCD*/
    const podInfo : Pod = await this.podService.getPod(podId);
    const workernodeName = podInfo.value.workernode;
    
    /*API to ETCD : Get worker nodes information which was binding this container from ETCD*/
    const WorkerNodeInfo : WorkerNode = await this.workernodeService.getWorkerNodeInfo(workernodeName);
    
    const workernodeIp : string = WorkerNodeInfo.value.ip
    const workernodePort : string = WorkerNodeInfo.value.port
    let workernodeContainers : number = WorkerNodeInfo.value.containers
    let workernodePods : number = WorkerNodeInfo.value.pods

    /*API to kubelet : Remove container*/
    const containerIdList : ContainerIdInfo[] = podInfo.value.containeridlist
    for(var container of containerIdList){
      const containerId = container.id
      await this.appService.removeContainer(workernodeIp, workernodePort, containerId);
    }


    /*API to ETCD : Update the worker node's container count in ETCD*/
    const containerNumber : number = containerIdList.length;
    workernodeContainers=workernodeContainers-containerNumber;
    workernodePods=workernodePods-1
    await this.workernodeService.sendWorkerNodeInfoToDB(workernodeName, workernodeIp, workernodePort, workernodeContainers, workernodePods);

    /*API to ETCD : Store the container information and bind it to the worker node in the ETCD*/
    await this.podService.removePodInfo(podId)

    return `${podId}(pod id) is removed in ${workernodeName}(worker-node name)`;
  }

  @Post('/worker')
  async addWorkerNodeInfo(@Body() body: {name: string, ip: string, port: string}) {
    const {name, ip, port} = body;
    
    return this.workernodeService.sendWorkerNodeInfoToDB(name, ip, port, 0, 0);
  }

  @Get('/container/getall')
  async getContainerList(): Promise<Container[]> {
    return this.containerService.getAllContainerList();
  }

}
