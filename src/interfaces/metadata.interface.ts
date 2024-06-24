export interface WorkerNodeMetadata {
  name: string;
  ip: string;
  port: string;
}

export interface ContainerMetadata {
  name : string;
  deployment : string;
  workernode : string;
}