import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pod } from '../entities/pod.entity';
import { PodMetadata } from '../interfaces/metadata.interface'

import { ContainerService } from '../container/container.service'
import { ContainerMetadata } from '../interfaces/metadata.interface'

@Injectable()
export class PodService {
    constructor(
        @InjectRepository(Pod, 'podConnection')
        private readonly podRepository: Repository<Pod>,
        private readonly containerService: ContainerService
    ){}

    async create(key: string, value: PodMetadata): Promise<Pod> {
        const conatinerlist : ContainerMetadata[] = value.containerlist;

        /*container db에 container info 저장 */
        for(const container of conatinerlist){
            await this.containerService.create(container.name, container)
        }

        try{
          const container = this.podRepository.create({ key, value });
            await this.podRepository.save(container);
              return container
        } catch (error) {
          console.error('Error saving key-value pair:', error);
            throw new Error('Could not save key-value pair');
          }
        }

}
