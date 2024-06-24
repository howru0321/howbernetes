import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('run-container')
  async runContainer(@Body() body:{container : string, image : string}) {
    const {container, image} = body;

    
    const containerMetadata = await this.appService.runContainer(container, image);
    return containerMetadata;
  }

  @Post('remove-container')
  async removeContainer(@Body() body:{container : string}) {
    const {container} = body;
    
    const stdoutmessage = await this.appService.removeContainer(container);
    return stdoutmessage;
  }
}
