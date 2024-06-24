import { Controller, Get, Post, Body} from '@nestjs/common';
import { AppService } from './app.service';
import { WorkernodeService } from './workernode/workernode.service';
import { ContainerService } from './container/container.service';
import * as yaml from 'js-yaml';
import { WorkerNode } from './entities/workernode.entity';
import { ContainerMetadata } from './interfaces/metadata.interface'
import { Container } from './entities/container.entity';
import { IntegerType } from 'typeorm';


@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly workernodeService: WorkernodeService,
    private readonly containerService: ContainerService
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('/deploy')
  deploy(@Body() body: { data: string }): string {
    try {
      const config = yaml.load(body.data);
      console.log('Received deployment configuration:', config);
      // 여기에 실제 배포 로직을 추가합니다.
      return 'Deployment configuration received successfully';
    } catch (error) {
      console.error('Error parsing the YAML file:', error);
      throw new Error('Invalid YAML file');
    }
  }

  @Post('/run')
  async runContainer(@Body() body: {container: string, image: string }) {
    const { container, image } = body;
    
    const allWorkerNodeInfo : WorkerNode[] = await this.workernodeService.getAllWorkerNodeInfo();
    const minContainersWorkerNode : WorkerNode = await this.workernodeService.checkWorkerNodeInfo(allWorkerNodeInfo);
    
    const workernodeName : string = minContainersWorkerNode.key
    const workernodeIp : string = minContainersWorkerNode.value.ip
    const workernodePort : string = minContainersWorkerNode.value.port
    let workernodeContainers : IntegerType = parseInt(minContainersWorkerNode.value.containers)

    const metadata = await this.appService.sendContainerImage(workernodeIp, workernodePort, container, image);
    
    //modify containers
    workernodeContainers=workernodeContainers+1;
    const workernworkernodeContainersString=workernodeContainers.toString();
    this.workernodeService.sendWorkerNodeInfoToDB(workernodeName, workernodeIp, workernodePort, workernworkernodeContainersString);

    const successmessage : string = await this.containerService.sendContainerInfoToDB(container, null, workernodeName, metadata)

    return workernworkernodeContainersString;
  }

  @Post('/worker')
  async addWorkerNodeInfo(@Body() body: {name: string, ip: string, port: string}) {
    const {name, ip, port} = body;
    
    return this.workernodeService.sendWorkerNodeInfoToDB(name, ip, port, "0");
  }

  @Get('/container/getall')
  async getContainerList(): Promise<Container[]> {
    return this.containerService.getAllContainerList();
  }

}
