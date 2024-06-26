import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Replicaset } from '../entities/replicaset.entity';
import { ReplicasetMetadata } from '../interfaces/metadata.interface'
import { PodService } from '../pod/pod.service'

@Injectable()
export class ReplicasetService {
    constructor(
        @InjectRepository(Replicaset, 'replicasetConnection')
        private readonly replicasetRepository: Repository<Replicaset>,
        private readonly podService: PodService
    ){}

    async create(key: string, value: ReplicasetMetadata): Promise<Replicaset> {
        try{
          const replicaset = this.replicasetRepository.create({ key, value });
          await this.replicasetRepository.save(replicaset);
          return replicaset
        } catch (error) {
          console.error('Error saving key-value pair:', error);
          throw new Error('Could not save key-value pair');
          }
      }

      async get(key: string): Promise<Replicaset> {
        try{
            return await this.replicasetRepository.findOne({where : {key}});
        } catch (error) {
            console.error(error);
            throw new Error('Could not get');
        }
      }

      async delete(key: string): Promise<Replicaset> {
        try{
          const replicaset : Replicaset = await this.get(key)
          const podIdList : string[] = replicaset.value.podidlist
          for(var podId of podIdList){
            await this.podService.delete(podId)
          }
          return await this.replicasetRepository.remove(replicaset);
        } catch (error) {
          console.error(error);
          throw new Error('Could not get');
        }
      }

      async getAll(): Promise<Replicaset[]> {
        try{
            return await this.replicasetRepository.find();
        } catch (error) {
            console.error(error);
            throw new Error('Could not getAll');
        }
      }

}
