
export interface WorkerNodeMetadata {
  name: string;
  ip: string;
  port: string;
  containers: number;
  pods : number;
  deployments : number;
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
  containerlist : ContainerMetadata[];
}

export interface DeploymentMetadata {
  name : string;
  workernode : string;
  replica : number;
  podname : string;
}