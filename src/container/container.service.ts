import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Container } from '../entities/container.entity';
import { ContainerMetadata } from '../interfaces/metadata.interface'

@Injectable()
export class ContainerService {
  constructor(
    @InjectRepository(Container, 'containerConnection')
      private readonly containerRepository: Repository<Container>,
  ) {}
      
  async create(key: string, value: ContainerMetadata): Promise<Container> {
    try{
      const container = this.containerRepository.create({ key, value });
        await this.containerRepository.save(container);
          return container
    } catch (error) {
      console.error('Error saving key-value pair:', error);
        throw new Error('Could not save key-value pair');
      }
    }

    async get(key: string): Promise<Container> {
      try{
          return await this.containerRepository.findOne({where : {key}});
      } catch (error) {
          console.error(error);
          throw new Error('Could not get');
      }
    }

    async getAll(): Promise<Container[]> {
      try{
          return await this.containerRepository.find();
      } catch (error) {
          console.error(error);
          throw new Error('Could not getAll');
      }
    }
}
