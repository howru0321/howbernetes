import { Controller, Get, Post, Body} from '@nestjs/common';
import { HttpService } from '@nestjs/axios'
import { AppService } from './app.service';
import * as yaml from 'js-yaml';
import { lastValueFrom } from 'rxjs';
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly httpService: HttpService
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
  runContainer(@Body() body: {container: string, image: number }) {
    const { container, image } = body;
    console.log(`Container: ${container}, Image: ${image}`);

    return `Container ${container} with image ${image} is being processed`
  }

  @Post('/worker')
  async addWorkerNodeInfo(@Body() body: {name: string, ip: string, port: string}) {
    const {name, ip, port} = body;
    
    const response = await lastValueFrom(
      this.httpService.post(
        'http://howbe-db-container:3001/workernode',
        {
          name : name,
          ip : ip,
          port : port
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    return response.data;
  }

}
