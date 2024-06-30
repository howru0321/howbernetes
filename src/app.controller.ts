import { Controller, Get, Post, Delete, Patch, Query, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { WorkernodeService } from './workernode/workernode.service';
import { ContainerService } from './container/container.service';
import { PodService } from './pod/pod.service'
import { WorkerNode } from './entities/workernode.entity';
import { Container } from './entities/container.entity';
import { CreatePodDto, PodMetadata, ReplicasetMetadata, ContainerInfo, PodTemplate, Label, CreateReplicasetDto, CreateDeploymentDto, ContainerIdInfo } from './interfaces/metadata.interface';
import { Pod } from './entities/pod.entity';
import { Deployment } from './entities/deployment.entity';
import { v4 as uuidv4 } from 'uuid';
import { ReplicasetService } from './replicaset/replicaset.service';
import { Replicaset } from './entities/replicaset.entity';
import { DeploymentService } from './deployment/deployment.service';


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

  @Get()
  getHello(): string {
    return this.appService.getHello();
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

  /**
   * This function creates a pod and schedules it on a worker node with the fewest containers.
   * It interacts with the scheduler to find the appropriate worker node, runs containers on the kubelet, and updates the state in ETCD.
   * @param podId - The ID of the pod.
   * @param podName - The name of the pod.
   * @param podLabels - An array of labels of the pod.
   * @param containerlist - A list of containers to be included in the pod.
   * @param replicasetName - The name of the replicaset to which the pod belongs.
   * @returns A promise that resolves to the name of the worker node where the pod is scheduled.
   */
  private async createPodF(
    podId : string,
    podName : string,
    podLabels : Label[],
    containerlist : ContainerInfo[],
    replicasetName : string
  ) : Promise<string>{
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
    await this.workernodeService.updateWorkerNode(workernodeIp, workernodePort, workernodeContainers, workernodePods);
    }

    return workernodeName;
  }

  /**
   * This function handles the HTTP POST request to create a new pod.
   * It parses the request data, checks if a pod with the given name already exists, and if not, it creates a new pod and schedules it on a worker node.
   * @param body - The data sent in the request body to create a pod.
   * @returns A message indicating the status of the pod creation.
   */
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

  /**
 * This function creates a replicaset with a specified number of replicas.
  * It generates unique pod IDs, creates the pods, and updates the replicaset state in the database.
  * @param replicasetName - The name of the replicaset.
  * @param replicas - The number of replicas to be created.
  * @param deployment - The deployment to which the replicaset belongs.
  * @param matchLabels - An array of match labels of replicaset.
  * @param podName - The name of the pod in replicaset.
  * @param podLabels - An array of labels of the pod.
  * @param containerlist - The list of containers to be included in each pod.
  * @returns A promise that resolves when the replicaset is successfully created.
  */
  private async createReplicasetF(
    replicasetName : string,
    replicas : number,
    deployment : string,
    matchLabels : Label[],
    podName : string,
    podLabels : Label[],
    containerlist : ContainerInfo[]
  ) : Promise<void> {
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

  /**
   * This function handles the HTTP POST request to create a new replicaset.
   * It parses the request data, checks if a replicaset with the given name already exists, and if not, it creates a new replicaset with the specified number of replicas and updates the state.
   * @param body - The data sent in the request body to create a replicaset.
   * @returns A message indicating the status of the replicaset creation.
   */
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

  /**
   * This function handles the HTTP POST request to create a new deployment.
   * It parses the request data, checks if a deployment with the given name already exists, and if not, it creates a new deployment with the specified configuration and updates the state.
   * @param body - The data sent in the request body to create a deployment.
   * @returns A message indicating the status of the deployment creation.
   */
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

  /**
   * This function handles the HTTP POST request to apply changes to a deployment.
   * It parses the request data, generates a new replicaset if necessary, and updates or recreates the deployment based on the specified strategy type.
   * @param body - The data sent in the request body to apply changes to a deployment.
   * @returns A message indicating the status of the deployment apply operation.
   */
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

    this.deploymentService.updateDeploymentState(deploymentName, replicasetId, strategyType);

    return `${deploymentName}(deployment) is running`;
  }

  /**
 * This function deletes a pod and optionally its replicas.
 * It interacts with ETCD to get and update the container and pod information, and it communicates with kubelet to remove the containers.
 * @param podId - The ID of the pod to be deleted.
 * @param isDeleteReplicas - A boolean indicating whether to delete the replicas. When the user deletes the pod inside the replica set from the outside, regenerate the pod again to match the replicas.
 * @returns A promise that resolves to the name of the worker node where the pod was deleted.
 */
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
      await this.workernodeService.updateWorkerNode(workernodeIp, workernodePort, workernodeContainers, workernodePods);
    }

    /*API to ETCD : Remove Pod State in PodDB*/
    await this.podService.removePod(podId);

    /*API to ETCD : Update the worker node's container count in WorkernodeDB*/
    const containerNumber : number = containerIdList.length;
    workernodePods=workernodePods-1;
    await this.workernodeService.updateWorkerNode(workernodeIp, workernodePort, workernodeContainers, workernodePods);

    
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

  /**
   * This function handles the HTTP DELETE request to delete a pod.
   * It checks if the pod with the given ID exists, and if so, it deletes the pod and returns a message indicating the successful deletion.
   * @param podId - The ID of the pod to be deleted, passed as a query parameter.
   * @returns A message indicating the status of the pod deletion.
   */
  @Delete('/delete/pod')
  async deletePod(@Query('name') podId : string) {
    const podInfo : Pod = await this.podService.getPod(podId);
    if(!podInfo){
      return `There is no ${podId} in pod list.`
    }
    const workernodeName:string = await this.deletePodF(podId, false);

    return `${podId}(pod id) is removed in ${workernodeName}(worker-node)`;
  }

  /**
   * This function deletes a replicaset and all its associated pods.
   * It iterates through the list of pod IDs, deletes each pod, and updates the replicaset state accordingly.
   * Once all pods are deleted, it removes the replicaset itself.
   * @param replicasetName - The name of the replicaset to be deleted.
   * @param replicasetMetadata - The metadata of the replicaset, including pod information.
   * @returns A promise that resolves when the replicaset is successfully deleted.
   */
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

 /**
  * This function handles the HTTP DELETE request to delete a replicaset.
  * It checks if the replicaset with the given name exists, and if so, it deletes the replicaset and all its associated pods.
  * If the replicaset belongs to a deployment, it creates a new replicaset for the deployment with the same configuration.
  * @param replicasetName - The name of the replicaset to be deleted, passed as a query parameter.
  * @returns A message indicating the status of the replicaset deletion.
  */
  @Delete('delete/replicaset')
  async deleteReplicaset(@Query('name') replicasetName : string) {
    const replicasetInfo : Replicaset = await this.replicasetService.getReplicaset(replicasetName);
    if(!replicasetInfo){
      return `There is no ${replicasetName} in deployment list.`
    }
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

  /**
   * This function handles the HTTP DELETE request to delete a deployment.
   * It checks if the deployment with the given name exists, and if so, it deletes the associated replicaset and then removes the deployment itself.
   * @param deploymentName - The name of the deployment to be deleted, passed as a query parameter.
   * @returns A message indicating the status of the deployment deletion.
   */
  @Delete('delete/deployment')
  async deleteDeployment(@Query('name') deploymentName : string) { 
    const deploymentInfo : Deployment = await this.deploymentService.getDeployment(deploymentName);
    if(!deploymentInfo){
      return `There is no ${deploymentName} in deployment list.`
    }
    const replicasetName : string = deploymentInfo.key + deploymentInfo.value.replicasetid;

    const replicasetInfo : Replicaset = await this.replicasetService.getReplicaset(replicasetName);
    await this.deleteReplicasetF(replicasetName, replicasetInfo.value);

    await this.deploymentService.removeDeployment(deploymentName);

    return `${deploymentName}(deployment) is removed`;
  }

  /**
   * This function handles the HTTP PATCH request to scale a replicaset.
   * It adjusts the number of replicas in the replicaset to the desired count by either adding or removing pods.
   * @param replicasetName - The name of the replicaset to be scaled, passed as a query parameter.
   * @param replicasString - The desired number of replicas, passed as a query parameter.
   * @returns A message indicating the status of the replicaset scaling operation.
   */
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
}
