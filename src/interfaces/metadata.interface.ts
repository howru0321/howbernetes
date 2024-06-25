
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