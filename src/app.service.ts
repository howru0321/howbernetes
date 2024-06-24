import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios'
import { WorkerNode } from './entities/workernode.entity';

@Injectable()
export class AppService {
  constructor(
    private readonly httpService: HttpService
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async sendContainerImage(workernodeIp : string, workernodePort : string, container : string, image : string):Promise<string> {
    const response = await lastValueFrom(
        this.httpService.post(
            `http://${workernodeIp}:${workernodePort}/run-container`,
            {
              container,
              image
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
