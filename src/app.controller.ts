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
  async runContainer(@Body() body:{image : string}) {
    const {image} = body;

    
    const containerMetadata = await this.appService.runContainer(image);
    return containerMetadata;
  }

  @Post('remove-container')
  async removeContainer(@Body() body:{containerId : string}) {
    const {containerId} = body;
    
    const stdoutmessage = await this.appService.removeContainer(containerId);
    return stdoutmessage;
  }
}
