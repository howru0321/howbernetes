import { Entity, Column, PrimaryColumn } from 'typeorm';
import { ReplicasetMetadata } from '../interfaces/metadata.interface'

@Entity()
export class Replicaset {
    @PrimaryColumn()
    key: string;
  
    @Column('simple-json')
    value: ReplicasetMetadata;
}