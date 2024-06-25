import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pod } from '../entities/pod.entity';
import { PodMetadata } from '../interfaces/metadata.interface'

import { ContainerService } from '../container/container.service'
import { ContainerMetadata } from '../interfaces/metadata.interface'
import { ContainerIdInfo } from '../interfaces/metadata.interface'

@Injectable()
export class PodService {
    constructor(
        @InjectRepository(Pod, 'podConnection')
        private readonly podRepository: Repository<Pod>,
        private readonly containerService: ContainerService
    ){}

    async create(key: string, value: PodMetadata, containerMetadataList : ContainerMetadata[]): Promise<Pod> {
      /*container db에 container info 저장 */
      for(const container of containerMetadataList){
          await this.containerService.create(container.id, container)
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

    async get(key: string): Promise<Pod> {
      try{
          return await this.podRepository.findOne({where : {key}});
      } catch (error) {
          console.error(error);
          throw new Error('Could not get');
      }
    }

    async delete(key: string): Promise<Pod> {
      try{
        const pod : Pod = await this.get(key)
        const containeridlist : ContainerIdInfo[] = pod.value.containeridlist
        for(var container of containeridlist){
          await this.containerService.delete(container.id)
        }
        return await this.podRepository.remove(pod);
      } catch (error) {
        console.error(error);
        throw new Error('Could not get');
      }
    }

    async getAll(): Promise<Pod[]> {
      try{
          return await this.podRepository.find();
      } catch (error) {
          console.error(error);
          throw new Error('Could not getAll');
      }
    }

}
