import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkerNode } from '../entities/workernode.entity';
import { Metadata } from '../interfaces/metadata.interface'

@Injectable()
export class WorkernodeService {
    constructor(
        @InjectRepository(WorkerNode, 'workernodeConnection')
        private readonly workerNodeRepository: Repository<WorkerNode>,
    ) {}

    async create(key: string, value: Metadata): Promise<WorkerNode> {
        try{
            const container = this.workerNodeRepository.create({ key, value });
            await this.workerNodeRepository.save(container);
            return container
        } catch (error) {
            console.error('Error saving key-value pair:', error);
            throw new Error('Could not save key-value pair');
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
