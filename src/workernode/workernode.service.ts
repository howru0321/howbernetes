import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkerNode } from '../entities/workernode.entity';
import { WorkerNodeMetadata } from '../interfaces/metadata.interface'

@Injectable()
export class WorkernodeService {
    constructor(
        @InjectRepository(WorkerNode, 'workernodeConnection')
        private readonly workerNodeRepository: Repository<WorkerNode>,
    ) {}

    async create(key: string, value: WorkerNodeMetadata): Promise<WorkerNode> {
        try{
            const container : WorkerNode = this.workerNodeRepository.create({ key, value });
            await this.workerNodeRepository.save(container);
            return container
        } catch (error) {
            console.error('Error saving key-value pair:', error);
            throw new Error('Could not save key-value pair');
        }
      }

      async delete(key: string): Promise<WorkerNode> {
        try{
          const workernode : WorkerNode = await this.get(key)
          return await this.workerNodeRepository.remove(workernode);
        } catch (error) {
          console.error(error);
          throw new Error('Could not get');
        }
      }

      async get(key: string): Promise<WorkerNode> {
        try{
            return await this.workerNodeRepository.findOne({where : {key}});
        } catch (error) {
            console.error(error);
            throw new Error('Could not get');
        }
      }

      async getAll(): Promise<WorkerNode[]> {
        try{
            return await this.workerNodeRepository.find();
        } catch (error) {
            console.error(error);
            throw new Error('Could not getAll');
        }
      }
}
