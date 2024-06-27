import { Controller, Get, Post, Delete, Patch, Query, Body, UseInterceptors, UploadedFile} from '@nestjs/common';
import { AppService } from './app.service';
import { WorkernodeService } from './workernode/workernode.service';
import { ContainerService } from './container/container.service';
import { PodService } from './pod/pod.service'
import { WorkerNode } from './entities/workernode.entity';
import { Container } from './entities/container.entity';
import { CreatePodDto, PodMetadata, ReplicasetMetadata } from './interfaces/metadata.interface';
import { CreateReplicasetDto, CreateDeploymentDto } from './interfaces/metadata.interface'
import { ContainerInfo } from './interfaces/metadata.interface';
import { ContainerMetadata } from './interfaces/metadata.interface';
import { Pod } from './entities/pod.entity';
import { Deployment } from './entities/deployment.entity'
import { ContainerIdInfo } from './interfaces/metadata.interface'
import { v4 as uuidv4 } from 'uuid';
import { ReplicasetService } from './replicaset/replicaset.service'
import { PodTemplate } from './interfaces/metadata.interface'
import { Label } from './interfaces/metadata.interface'
import { Replicaset } from './entities/replicaset.entity'
import { DeploymentService } from './deployment/deployment.service'
import { query } from 'express';


@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly workernodeService: WorkernodeService,
    private readonly containerService: ContainerService,
    private readonly podService: PodService,
    private readonly replicasetService: ReplicasetService,
    private readonly deploymentService: DeploymentService
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

    if(await this.podService.getPod(podName)){
      return `${podName} is already exist.`;
    }

    const workernodeName : string = await this.createPodF(podName, podName, podLabels, containerlist, null);

    return `${podName}(container) is running in ${workernodeName}(worker-node)`;
  }

  private async createReplicasetF(replicasetName : string, replicas : number, deployment : string, matchLabels : Label[], podName : string, podLabels : Label[], containerlist : ContainerInfo[]) : Promise<void> {
    let podIdList : string[] = [];
    for(let i = 0; i < replicas; i++){
      const newUUID : string = await this.generateUUID(podIdList);
      const podId : string = podName + newUUID;
      await this.createPodF(podId, podName, podLabels, containerlist, replicasetName);
      podIdList.push(newUUID);
      const podTemplate : PodTemplate = {
        name : podName,
        podlabel : podLabels,
        containerlist : containerlist
      }
      await this.replicasetService.updateReplicasetState(replicasetName, replicas, deployment, matchLabels, podIdList, podTemplate);
    }
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

    if(await this.replicasetService.getReplicaset(replicasetName)){
      return `${replicasetName} is already exist.`
    }

    await this.createReplicasetF(replicasetName, replicas, null, matchLabels, podName, podLabels, containerlist);

    return `${replicasetName}(replicaset) is running`;
  }

  @Post('/create/deployment')
  async createDeployment(@Body() body: CreateDeploymentDto) {
    //Request Data Parsing
    const deploymentName : string = body.deploymentName;
    const matchLabels : Label[] = body.matchLabels;
    const replicas : number = body.replicas;
    const strategyType : string = body.strategyType;
    const podName : string = body.podInfo.podName;
    const podLabels : Label[] = body.podInfo.podLabels;
    const containerlist : ContainerInfo[] = body.podInfo.containerInfolist;
    

    const deploymentInfo : Deployment = await this.deploymentService.getDeployment(deploymentName)
    if(deploymentInfo){
      return `${deploymentName} is already exist.`
    }

    const replicasetId : string = await this.generateUUID([]);
    const replicasetName : string = deploymentName + replicasetId;

    await this.createReplicasetF(replicasetName, replicas, deploymentName, matchLabels, podName, podLabels, containerlist);
    await this.deploymentService.updateDeploymentState(deploymentName, replicasetId, strategyType);

    return `${deploymentName}(deployment) is running`;

  }
  @Post('/apply/deployment')
  async applyDeployment(@Body() body: CreateDeploymentDto) {
    //Request Data Parsing
    const deploymentName : string = body.deploymentName;
    const matchLabels : Label[] = body.matchLabels;
    const replicas : number = body.replicas;
    const strategyType : string = body.strategyType;
    const podName : string = body.podInfo.podName;
    const podLabels : Label[] = body.podInfo.podLabels;
    const containerlist : ContainerInfo[] = body.podInfo.containerInfolist;
    

    const replicasetId : string = await this.generateUUID([]);
    const replicasetName : string = deploymentName + replicasetId;
    const deploymentInfo : Deployment = await this.deploymentService.getDeployment(deploymentName);
    if(deploymentInfo){
      const currentreplicasetName : string = deploymentInfo.value.name + deploymentInfo.value.replicasetid;
      const currentreplicasetInfo : Replicaset = await this.replicasetService.getReplicaset(currentreplicasetName);
      const currentreplicasetMetadata : ReplicasetMetadata = currentreplicasetInfo.value;
      if(strategyType === "RollingUpdate"){
        await this.createReplicasetF(replicasetName, replicas, deploymentName, matchLabels, podName, podLabels, containerlist);
        await this.deleteReplicasetF(currentreplicasetName,currentreplicasetMetadata);
      }else if(strategyType === "Recreate"){
        await this.deleteReplicasetF(currentreplicasetName,currentreplicasetMetadata);
        await this.createReplicasetF(replicasetName, replicas, deploymentName, matchLabels, podName, podLabels, containerlist);
      }
    }
    else{
      await this.createReplicasetF(replicasetName, replicas, deploymentName, matchLabels, podName, podLabels, containerlist);
    }

    //this.createReplicasetF(replicasetName, replicas, matchLabels, podName, podLabels, containerlist);
    this.deploymentService.updateDeploymentState(deploymentName, replicasetId, strategyType);

    return `${deploymentName}(deployment) is running`;

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
    const WorkerNodeInfo : WorkerNode = await this.workernodeService.getWorkerNode(workernodeName);
    
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
      const deploymentName : string = replicasetInfo.value.deployment;
      const matchLabels : Label[] = replicasetInfo.value.matchlabel;

      const podTemplate : PodTemplate= replicasetInfo.value.podtemplate;
      const containerList : ContainerInfo[] = podTemplate.containerlist;

      const podIdList : string[] = replicasetInfo.value.podidlist;
      const newUUID : string = await this.generateUUID(podIdList);
      const newpodId : string = podName + newUUID;
      const newpodIdList: string[] = podIdList.map(pId => (podName + pId) === podId ? newUUID : pId);
      await this.createPodF(newpodId, podName, podLabels, containerList, replicasetName);
      
      await this.replicasetService.updateReplicasetState(replicasetName, replicas, deploymentName, matchLabels, newpodIdList, podTemplate);
    }

    return workernodeName;
  }

  @Delete('/delete/pod')
  async deletePod(@Query('name') podId : string) {
    const workernodeName:string = await this.deletePodF(podId, false);

    return `${podId}(pod id) is removed in ${workernodeName}(worker-node)`;
  }

  private async deleteReplicasetF(replicasetName : string, replicasetMetadata : ReplicasetMetadata) : Promise<void> {
    const podName : string = replicasetMetadata.podtemplate.name;
    const podIdList : string[] = replicasetMetadata.podidlist;
    const replicas : number = replicasetMetadata.replicas;
    const deploymentName : string = replicasetMetadata.deployment;
    const matchLabels : Label[] = replicasetMetadata.matchlabel;
    const podTemplate : PodTemplate = replicasetMetadata.podtemplate;
    while(podIdList.length != 0){
      const podId : string = podIdList.pop();
      await this.deletePodF(podName + podId, true);

      await this.replicasetService.updateReplicasetState(replicasetName, replicas, deploymentName, matchLabels, podIdList, podTemplate);
    }

    await this.replicasetService.removeReplicase(replicasetName);
  }
  @Delete('delete/replicaset')
  async deleteReplicaset(@Query('name') replicasetName : string) {
    const replicasetInfo : Replicaset = await this.replicasetService.getReplicaset(replicasetName);
    const deploymentName : string = replicasetInfo.value.deployment;
    const replicas : number = replicasetInfo.value.replicas;
    const matchLabels : Label[] = replicasetInfo.value.matchlabel;
    const podName : string = replicasetInfo.value.podtemplate.name;
    const podLabels : Label[] = replicasetInfo.value.podtemplate.podlabel;
    const containerList : ContainerInfo[] = replicasetInfo.value.podtemplate.containerlist;
    await this.deleteReplicasetF(replicasetName, replicasetInfo.value);

    if(deploymentName){
      const deploymentInfo : Deployment = await this.deploymentService.getDeployment(deploymentName);
      const currentUUID : string = deploymentInfo.value.replicasetid;
      const currentstrategyType : string = deploymentInfo.value.strategyType;
      let newUUID : string = "";
      do{
        newUUID=await this.generateUUID([]);
      }while(newUUID === currentUUID);

      const newreplicasetName : string = deploymentName + newUUID;
      await this.createReplicasetF(newreplicasetName, replicas, deploymentName, matchLabels, podName, podLabels, containerList);
      await this.deploymentService.updateDeploymentState(deploymentName, newUUID, currentstrategyType);
    }

    return `${replicasetName}(pod id) is removed`;
  }

  @Delete('delete/deployment')
  async deleteDeployment(@Query('name') deploymentName : string) { 
    const deploymentInfo : Deployment = await this.deploymentService.getDeployment(deploymentName);
    const replicasetName : string = deploymentInfo.key + deploymentInfo.value.replicasetid;

    const replicasetInfo : Replicaset = await this.replicasetService.getReplicaset(replicasetName);
    await this.deleteReplicasetF(replicasetName, replicasetInfo.value);

    await this.deploymentService.removeDeployment(deploymentName);

    return `${deploymentName}(deployment) is removed`;
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
            await this.replicasetService.updateReplicasetState(replicasetName, replicas, null, matchLabels, newpodIdList, podTemplate);
          }
        } else{
          const iter : number = replicas - currentreplicas;
          for(let i = 0; i < iter ; i++){
            const newUUID : string = await this.generateUUID(podIdList);
            const newpodId : string = podName + newUUID;
            await this.createPodF(newpodId, podName, podLabels, containerList, replicasetName);
            newpodIdList.push(newUUID);
            await this.replicasetService.updateReplicasetState(replicasetName, replicas, null, matchLabels, newpodIdList, podTemplate);
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
  @Get('/getall/pod')
  async getallPod(): Promise<Pod[]> {
    return this.podService.getAllPodList();
  }

  @Get('/get/replicaset')
  async getReplicaset(@Query('name') name : string): Promise<Replicaset> {
    return this.replicasetService.getReplicaset(name);
  }
  @Get('/getall/replicaset')
  async getallReplicaset(): Promise<Replicaset[]> {
    return this.replicasetService.getAllReplicasetList();
  }

  @Get('/get/deployment')
  async getDeployment(@Query('name') name : string): Promise<Deployment> {
    return this.deploymentService.getDeployment(name);
  }
  @Get('/getall/deployment')
  async getallDeployment(): Promise<Deployment[]> {
    return this.deploymentService.getAllDeploymentList();
  }

  @Get('/get/workernode')
  async getWorkerNode(@Query('name') name : string): Promise<WorkerNode> {
    return this.workernodeService.getWorkerNode(name);
  }
  @Get('/getall/workernode')
  async getallWorkerNode(): Promise<WorkerNode[]> {
    return this.workernodeService.getAllWorkerNodeInfo();
  }


  @Post('/worker')
  async addWorkerNodeInfo(@Body() body: {name: string, ip: string, port: string}) {
    const {name, ip, port} = body;
    
    const workernodeInfo : WorkerNode = await this.workernodeService.getWorkerNode(name);
    if(workernodeInfo){
      return `${name}(worker node) is already exist.`
    }
    return this.workernodeService.sendWorkerNodeInfoToDB(name, ip, port, 0, 0);
  }

  @Delete('/delete/worker')
  async deleteWorkerNodeInfo(@Query('name') name :string) {
    const workernodeInfo : WorkerNode = await this.workernodeService.getWorkerNode(name);

    if(workernodeInfo.value.pods !== 0){
      return `${name} is working! You cannot delete this worker node.`
    }

    return this.workernodeService.removeWorkernode(name);
  }

  @Get('/container/getall')
  async getContainerList(): Promise<Container[]> {
    return this.containerService.getAllContainerList();
  }

}
