import { Entity, Column, PrimaryColumn } from 'typeorm';
import { ContainerMetadata } from '../interfaces/metadata.interface'

@Entity()
export class Container {
    @PrimaryColumn()
    key: string;
  
    @Column('simple-json')
    value: ContainerMetadata;
}