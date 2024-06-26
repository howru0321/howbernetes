
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
  replicaset : string;
  workernode : string;
}

export interface PodMetadata {
  name : string;
  replicaset : string;
  workernode : string;
  containers : number;
  containeridlist : ContainerIdInfo[];
}

export interface ReplicasetMetadata {
  name : string;
  replicas : number;
  podidlist : string[];
  podtemplate : PodTemplate;
}

export interface PodTemplate {
  name : string;
  containerlist : ContainerInfo[];
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

export class CreateReplicasetDto {
  replicasetName: string;
  replicas: number;
  podInfo : CreatePodDto;
}