import { Entity, Column, PrimaryColumn } from 'typeorm';
import { DeploymentMetadata } from '../interfaces/metadata.interface'

@Entity()
export class Deployment {
    @PrimaryColumn()
    key: string;
  
    @Column('simple-json')
    value: DeploymentMetadata;
}