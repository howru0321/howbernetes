
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
  replicaset : string;
  workernode : string;
  containers : number;
  containeridlist : ContainerIdInfo[];
}

export interface DeploymentMetadata {
  name : string;
  replicasetid : string;
  strategyType : string;
}

export interface ReplicasetMetadata {
  name : string;
  replicas : number;
  deployment : string;
  matchlabel : Label[];
  podidlist : string[];
  podtemplate : PodTemplate;
}

export interface PodTemplate {
  name : string;
  podlabel : Label[];
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

export class CreateDeploymentDto {
  deploymentName: string;
  matchLabels : Label[];
  replicas: number;
  podInfo : CreatePodDto;
  strategyType : string;
}