import { Entity, Column, PrimaryColumn } from 'typeorm';
import { WorkerNodeMetadata } from '../interfaces/metadata.interface'

@Entity()
export class WorkerNode {
    @PrimaryColumn()
    key: string;
  
    @Column('simple-json')
    value: WorkerNodeMetadata;
}