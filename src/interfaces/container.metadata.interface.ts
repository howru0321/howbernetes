export interface ContainerMetadata {
    name : string;
    image : string;
    workernode : string;
  }

  export class ContainerInfo {
    name: string;
    image: string;
  }

  export class ContainerIdInfo {
    id : string;
    metadata : ContainerInfo;
  }