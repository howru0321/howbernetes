
export interface WorkerNodeMetadata {
  name: string;
  ip: string;
  port: string;
  containers: number;
  pods : number;
}

export interface ContainerMetadata {
  name : string;
  pod : string;
  deployment : string;
  workernode : string;
  metadata : string;
}

export interface PodMetadata {
  name : string;
  deployment : string;
  workernode : string;
  containers : number;
  containerlist : ContainerInfo[];
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