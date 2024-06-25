
export interface WorkerNodeMetadata {
  name: string;
  ip: string;
  port: string;
  containers: number;
  pods : number;
}

export interface ContainerMetadata {
  id : string;
  name : string;
  image : string;
  pod : string;
  deployment : string;
  workernode : string;
}

export interface PodMetadata {
  name : string;
  deployment : string;
  workernode : string;
  containers : number;
  containeridlist : ContainerIdInfo[];
}

export interface DeploymentMetadata {
  name : string;
  replica : number;
  podname : string;
}

export class CreatePodDto {
  podName: string;
  containerInfolist: ContainerInfo[];
}

export class ContainerInfo {
  name: string;
  image: string;
}

export class ContainerIdInfo {
  id : string;
  metadata : ContainerInfo;
}

export class CreateDeployDto {
  deployName: string;
  replicas: number;
  podInfo : CreatePodDto;
}