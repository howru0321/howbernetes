export interface WorkerNodeMetadata {
  name: string;
  ip: string;
  port: string;
  containers: string;
}

export interface ContainerMetadata {
  name : string;
  deployment : string;
  workernode : string;
}