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

}
