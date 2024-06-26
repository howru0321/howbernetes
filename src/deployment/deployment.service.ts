import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Deployment } from '../entities/deployment.entity';
import { DeploymentMetadata } from '../interfaces/metadata.interface'
import { PodService } from '../pod/pod.service'

@Injectable()
export class DeploymentService {
    constructor(
        @InjectRepository(Deployment, 'deploymentConnection')
        private readonly deploymentRepository: Repository<Deployment>,
        private readonly podService: PodService
    ){}

    async create(key: string, value: DeploymentMetadata): Promise<Deployment> {
        try{
          const deployment = this.deploymentRepository.create({ key, value });
          await this.deploymentRepository.save(deployment);
          return deployment
        } catch (error) {
          console.error('Error saving key-value pair:', error);
          throw new Error('Could not save key-value pair');
          }
      }

      async get(key: string): Promise<Deployment> {
        try{
            return await this.deploymentRepository.findOne({where : {key}});
        } catch (error) {
            console.error(error);
            throw new Error('Could not get');
        }
      }

      async delete(key: string): Promise<Deployment> {
        try{
          const deployment : Deployment = await this.get(key)
          const podIdList : string[] = deployment.value.podidlist
          for(var podId of podIdList){
            await this.podService.delete(podId)
          }
          return await this.deploymentRepository.remove(deployment);
        } catch (error) {
          console.error(error);
          throw new Error('Could not get');
        }
      }

      async getAll(): Promise<Deployment[]> {
        try{
            return await this.deploymentRepository.find();
        } catch (error) {
            console.error(error);
            throw new Error('Could not getAll');
        }
      }

}
