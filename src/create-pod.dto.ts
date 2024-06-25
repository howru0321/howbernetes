export class CreatePodDto {
    podName: string;
    containerInfolist: ContainerInfo[];
  }
  
  export class ContainerInfo {
    name: string;
    image: string;
  }