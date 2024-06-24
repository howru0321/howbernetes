import { Controller, Get, Post, Body} from '@nestjs/common';
import { AppService } from './app.service';
import { WorkernodeService } from './workernode/workernode.service';
import { ContainerService } from './container/container.service';
import * as yaml from 'js-yaml';
import { WorkerNode } from './entities/workernode.entity';
import { ContainerMetadata } from './interfaces/metadata.interface'


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
  async runContainer(@Body() body: {container: string, image: number }) {
    const { container, image } = body;
    
    const allWorkerNodeInfo : WorkerNode[] = await this.workernodeService.getAllWorkerNodeInfo();

    return allWorkerNodeInfo;
  }

  @Post('/worker')
  async addWorkerNodeInfo(@Body() body: {name: string, ip: string, port: string}) {
    const {name, ip, port} = body;
    
    return this.workernodeService.sendWorkerNodeInfoToDB(name, ip, port);
  }

  @Get('/container/getall')
  async getContainerList() {
    return this.containerService.getAllContainerList();
  }

  @Post('/test')
  async test(@Body() body: {name: string, deployment: string, workernode: string}) {
    const {name, deployment, workernode} = body;
    
    return this.containerService.sendContainerInfoToDB(name, deployment, workernode);
  }

}
