import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkerNode } from '../entities/workernode.entity';
import { WorkerNodeMetadata } from '../interfaces/workernode.interface'

@Injectable()
export class WorkernodeService {
  constructor(
      @InjectRepository(WorkerNode, 'workernodeConnection')
      private readonly workerNodeRepository: Repository<WorkerNode>,
  ) {}

  /**
   * Retrieves a specific worker node by its IP address.
   * @param ip - The IP address of the worker node.
   * @returns The worker node with the specified IP address.
   */
  async get(ip: string): Promise<WorkerNode> {
    try{
      const workernode : WorkerNode = await this.workerNodeRepository.findOne({where : {key : ip}});
      return workernode;
    } catch (error) {
        console.error(error);
        throw new Error(`Could not get workernode ${ip}`);
    }
  }

  /**
   * Retrieves all worker nodes from the repository.
   * @returns A list of all worker nodes.
   */
  async getAll(): Promise<WorkerNode[]> {
    try{
        return await this.workerNodeRepository.find();
    } catch (error) {
        console.error(error);
        throw new Error('Could not getAll');
    }
  }
  
  /**
   * Creates and saves a new worker node in the workernodeDB.
   * @param ip - The IP address of the worker node.
   * @param metadata - The metadata of the worker node.
   * @returns The saved worker node.
   */
  async create(ip: string, metadata: WorkerNodeMetadata): Promise<WorkerNode> {
      try{
          const container : WorkerNode = this.workerNodeRepository.create({ key : ip, value : metadata });
          await this.workerNodeRepository.save(container);
          return container
      } catch (error) {
          console.error('Error saving key-value pair:', error);
          throw new Error('Could not save key-value pair');
      }
    }

  /**
   * Deletes a worker node from the repository by its key.
   * @param key - The key (IP address) of the worker node to be deleted.
   * @returns The removed worker node.
   */
  async delete(key: string): Promise<WorkerNode> {
    try{
      const workernode : WorkerNode = await this.get(key);
      return await this.workerNodeRepository.remove(workernode);
    } catch (error) {
      console.error(error);
      throw new Error('Could not get');
    }
  }
}
