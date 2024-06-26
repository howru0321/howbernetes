
export interface WorkerNodeMetadata {
  name: string;
  ip: string;
  port: string;
  containers: number;
  pods : number;
}

export interface ContainerMetadata {
  name : string;
  image : string;
  workernode : string;
}

export interface PodMetadata {
  name : string;
  podLabels : Label[];
  workernode : string;
  containers : number;
  containeridlist : ContainerIdInfo[];
}

export interface ReplicasetMetadata {
  name : string;
  replicas : number;
  matchlabel : Label[];
  podidlist : string[];
  podtemplate : PodTemplate;
}

export interface PodTemplate {
  name : string;
  containerlist : ContainerInfo[];
}

export class CreatePodDto {
  podName: string;
  podLabels : Label[];
  containerInfolist: ContainerInfo[];
}

export class Label {
  key: string;
  value: string;
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
  matchLabels : Label[];
  replicas: number;
  podInfo : CreatePodDto;
}