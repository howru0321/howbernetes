import { Controller, Get, Post, Delete, Patch, Query, Body, UseInterceptors, UploadedFile} from '@nestjs/common';
import { AppService } from './app.service';
import { WorkernodeService } from './workernode/workernode.service';
import { ContainerService } from './container/container.service';
import { PodService } from './pod/pod.service'
import { WorkerNode } from './entities/workernode.entity';
import { Container } from './entities/container.entity';
import { CreatePodDto, PodMetadata, ReplicasetMetadata } from './interfaces/metadata.interface';
import { CreateReplicasetDto } from './interfaces/metadata.interface'
import { ContainerInfo } from './interfaces/metadata.interface';
import { ContainerMetadata } from './interfaces/metadata.interface';
import { Pod } from './entities/pod.entity';
import { ContainerIdInfo } from './interfaces/metadata.interface'
import { v4 as uuidv4 } from 'uuid';
import { ReplicasetService } from './replicaset/replicaset.service'
import { PodTemplate } from './interfaces/metadata.interface'
import { Label } from './interfaces/metadata.interface'
import { Replicaset } from './entities/replicaset.entity'


@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly workernodeService: WorkernodeService,
    private readonly containerService: ContainerService,
    private readonly podService: PodService,
    private readonly replicasetService: ReplicasetService
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

  private async generateUUID(existingUUIDs: string[]): Promise<string> {
    let newUUID: string;
    do {
      newUUID = await uuidv4();
    } while (existingUUIDs.includes(newUUID));
    
    return newUUID;
  }
  private async createPodF(podId : string, podName : string, podLabels : Label[], containerlist : ContainerInfo[], replicasetName : string) : Promise<string>{
    if(await this.podService.getPod(podId)){
      return null;
    }
    /*API to Scheduler : Scheduling Worker Nodes*/
    const minContainersWorkerNode : WorkerNode = await this.getMinContainersWorkerNodeFromScheduler();
        
    const workernodeName : string = minContainersWorkerNode.key;
    const workernodeIp : string = minContainersWorkerNode.value.ip;
    const workernodePort : string = minContainersWorkerNode.value.port;
    let workernodeContainers : number = minContainersWorkerNode.value.containers;
    let workernodePods : number = minContainersWorkerNode.value.pods;

    /*API to kubelet : Running cotainers*/
    /*API to ETCD : Add new Container State in ContainerDB*/
    let containerIdList : ContainerIdInfo[] = [];
    //const containerNumber : number = containerIdList.length;
    //workernodeContainers=workernodeContainers+containerNumber;
    for(var container of containerlist){
      const containerName = container.name;
      const imageName : string = container.image;

      const containerId : string = await this.appService.runContainerWithImage(workernodeIp, workernodePort, imageName);
      const containerInfo : ContainerIdInfo = {
        id : containerId,
        metadata : container
    }
    containerIdList.push(containerInfo);
      
    await this.containerService.updateContainerState(containerId, containerName, imageName, workernodeName);
    
    
    
    
    /*API to ETCD : update PodDB*/
    const containers : number = containerlist.length;
    const podMetadata : PodMetadata = {
      name : podName,
      podLabels : podLabels,
      replicaset : replicasetName,
      workernode : workernodeName,
      containers : containers,
      containeridlist : containerIdList
    }
    await this.podService.updatePodState(podId, podMetadata);

    /*API to ETCD : Update the worker node's container count in WorkernodeDB*/
    workernodeContainers=workernodeContainers+1;
    if(containerIdList.length === containerlist.length){
      workernodePods=workernodePods+1;
    }
    await this.workernodeService.sendWorkerNodeInfoToDB(workernodeName, workernodeIp, workernodePort, workernodeContainers, workernodePods);
    }

    return workernodeName;
  }
  @Post('/create/pod')
  async createPod(@Body() body : CreatePodDto){
    //Request Data Parsing
    const podName : string = body.podName;
    const podLabels : Label[] = body.podLabels;
    const containerlist : ContainerInfo[] = body.containerInfolist;

    const workernodeName : string = await this.createPodF(podName, podName, podLabels, containerlist, null);

    if(!workernodeName){
      return `${podName} is already exist.`;
    }
    return `${podName}(container) is running in ${workernodeName}(worker-node)`;
  }

  private async createReplicasetF(replicasetName : string, replicas : number, matchLabels : Label[], podName : string, podLabels : Label[], containerlist : ContainerInfo[]) : Promise<boolean> {
    if(await this.replicasetService.getReplicaset(replicasetName)){
      return false;
    }
    let podIdList : string[] = [];
    for(let i = 0; i < replicas; i++){
      const newUUID : string = await this.generateUUID(podIdList);
      const podId : string = podName + newUUID;
      await this.createPodF(podId, podName, podLabels, containerlist, replicasetName);
      podIdList.push(newUUID);
      const podTemplate : PodTemplate = {
        name : podName,
        containerlist : containerlist
      }
      await this.replicasetService.updateReplicasetState(replicasetName, replicas, matchLabels, podIdList, podTemplate);
    }
    
    return true;
  }
  @Post('/create/replicaset')
  async createReplicaset(@Body() body: CreateReplicasetDto) {
    //Request Data Parsing
    const replicasetName : string = body.replicasetName;
    const matchLabels : Label[] = body.matchLabels;
    const replicas : number = body.replicas;
    const podName : string = body.podInfo.podName;
    const podLabels : Label[] = body.podInfo.podLabels;
    const containerlist : ContainerInfo[] = body.podInfo.containerInfolist;

    const finish = await this.createReplicasetF(replicasetName, replicas, matchLabels, podName, podLabels, containerlist);

    if(!finish){
      return `${replicasetName} is already exist.`
    }
    return `${replicasetName}(replicaset) is running`;
  }

  private async deletePodF(podId: string, isDeleteReplicas : boolean) : Promise<string>{
    /*API to ETCD : Get container information from ETCD*/
    const podInfo : Pod = await this.podService.getPod(podId);
    //const podId : string = podInfo.key;
    const workernodeName : string = podInfo.value.workernode;
    const replicasetName : string = podInfo.value.replicaset;
    const podLabels : Label[] = podInfo.value.podLabels;
    const podName : string = podInfo.value.name;
    let containerIdList : ContainerIdInfo[] = podInfo.value.containeridlist;
    /*API to ETCD : Get worker nodes information which was binding this container from ETCD*/
    const WorkerNodeInfo : WorkerNode = await this.workernodeService.getWorkerNodeInfo(workernodeName);
    
    const workernodeIp : string = WorkerNodeInfo.value.ip;
    const workernodePort : string = WorkerNodeInfo.value.port;
    let workernodeContainers : number = WorkerNodeInfo.value.containers;
    let workernodePods : number = WorkerNodeInfo.value.pods;
    /*API to kubelet : Remove containers*/
    /*API to ETCD : Remove Container State in ContainerDB*/
    const containers : number = containerIdList.length;
    for(let index in containerIdList){
      const container = containerIdList[index];
      const containerId = container.id;
      await this.appService.removeContainer(workernodeIp, workernodePort, containerId);
      await this.containerService.removeContainer(containerId);

      /*API to ETCD : update PodDB*/
      container.id=null;
      containerIdList[index]=container;
      const podMetadata : PodMetadata = {
        name : podName,
        podLabels : podLabels,
        replicaset : replicasetName,
        workernode : workernodeName,
        containers : containers,
        containeridlist : containerIdList
      }
      await this.podService.updatePodState(podId, podMetadata);

      workernodeContainers=workernodeContainers-1;
      await this.workernodeService.sendWorkerNodeInfoToDB(workernodeName, workernodeIp, workernodePort, workernodeContainers, workernodePods);
    }

    /*API to ETCD : Remove Pod State in PodDB*/
    await this.podService.removePod(podId);

    /*API to ETCD : Update the worker node's container count in WorkernodeDB*/
    const containerNumber : number = containerIdList.length;
    workernodePods=workernodePods-1;
    await this.workernodeService.sendWorkerNodeInfoToDB(workernodeName, workernodeIp, workernodePort, workernodeContainers, workernodePods);

    
    if(replicasetName != null && !isDeleteReplicas){
      const replicasetInfo : Replicaset = await this.replicasetService.getReplicaset(replicasetName);
      const replicas : number = replicasetInfo.value.replicas;
      const matchLabels : Label[] = replicasetInfo.value.matchlabel;

      const podTemplate : PodTemplate= replicasetInfo.value.podtemplate;
      const containerList : ContainerInfo[] = podTemplate.containerlist;

      const podIdList : string[] = replicasetInfo.value.podidlist;
      const newUUID : string = await this.generateUUID(podIdList);
      const newpodId : string = podName + newUUID;
      const newpodIdList: string[] = podIdList.map(pId => (podName + pId) === podId ? newUUID : pId);
      await this.createPodF(newpodId, podName, podLabels, containerList, replicasetName);
      
      await this.replicasetService.updateReplicasetState(replicasetName, replicas, matchLabels, newpodIdList, podTemplate);
    }

    return workernodeName;
  }

  @Delete('/delete/pod')
  async deletePod(@Query('name') podId : string) {
    const workernodeName:string = await this.deletePodF(podId, false);

    return `${podId}(pod id) is removed in ${workernodeName}(worker-node)`;
  }

  private async deleteReplicasetF(replicasetName : string, replicasetInfo : Replicaset) : Promise<void> {
    const podName : string = replicasetInfo.value.podtemplate.name;
    const podIdList : string[] = replicasetInfo.value.podidlist;
    const replicas : number = replicasetInfo.value.replicas;
    const matchLabels : Label[] = replicasetInfo.value.matchlabel;
    const podTemplate : PodTemplate = replicasetInfo.value.podtemplate;
    while(podIdList.length != 0){
      const podId : string = podIdList.pop();
      await this.deletePodF(podName + podId, true);

      await this.replicasetService.updateReplicasetState(replicasetName, replicas, matchLabels, podIdList, podTemplate);
    }

    await this.replicasetService.removeReplicase(replicasetName);
  }
  @Delete('delete/replicaset')
  async deleteReplicaset(@Query('name') replicasetName : string) {
    const replicasetInfo : Replicaset = await this.replicasetService.getReplicaset(replicasetName);
    await this.deleteReplicasetF(replicasetName, replicasetInfo);

    return `${replicasetName}(pod id) is removed`;
  }

  @Patch('scale/replicaset')
  async scaleReplicaset(@Query('name') replicasetName : string, @Query('replicas') replicasString : number){
    try{
      const replicas = Number(replicasString);
      const replicasetInfo : Replicaset = await this.replicasetService.getReplicaset(replicasetName);
      const currentreplicas : number = replicasetInfo.value.replicas;
  
      if(currentreplicas === replicas){
        return `${replicasetName}'s replicas is already ${replicas}.`
      }
      else{
        const matchLabels : Label[] = replicasetInfo.value.matchlabel;
        const podTemplate : PodTemplate = replicasetInfo.value.podtemplate;
        const containerList : ContainerInfo[] = podTemplate.containerlist;
        const podName : string = replicasetInfo.value.podtemplate.name;
        const podLabels : Label[] = replicasetInfo.value.matchlabel;
        const podIdList : string[] = replicasetInfo.value.podidlist;
  
        const newpodIdList : string[] = [...podIdList];
        if(currentreplicas > replicas){
          const iter : number = currentreplicas - replicas;
          for(let i = 0; i < iter ; i++){
            const deletePodId = newpodIdList.pop();
            await this.deletePodF(podName+deletePodId, true);
            await this.replicasetService.updateReplicasetState(replicasetName, replicas, matchLabels, newpodIdList, podTemplate);
          }
        } else{
          const iter : number = replicas - currentreplicas;
          for(let i = 0; i < iter ; i++){
            const newUUID : string = await this.generateUUID(podIdList);
            const newpodId : string = podName + newUUID;
            await this.createPodF(newpodId, podName, podLabels, containerList, replicasetName);
            newpodIdList.push(newUUID);
            await this.replicasetService.updateReplicasetState(replicasetName, replicas, matchLabels, newpodIdList, podTemplate);
          }
        }
      }
    }catch (error) {
      console.error(`Failed to scale replicaset: ${replicasetName}`, error);
      throw new Error(`Failed to scale replicaset: ${replicasetName}, Error: ${error.message}`);
    }
  
  }

  @Get('/get/pod')
  async getPod(@Query('name') name : string): Promise<Pod> {
    return this.podService.getPod(name);
  }

  @Get('/get/replicaset')
  async getReplicaset(@Query('name') name : string): Promise<Replicaset> {
    return this.replicasetService.getReplicaset(name);
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
