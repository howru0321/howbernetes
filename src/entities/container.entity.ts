import { Entity, Column, PrimaryColumn } from 'typeorm';
import { Metadata } from '../interfaces/metadata.interface'

@Entity()
export class Container {
    @PrimaryColumn()
    key: string;
  
    @Column('simple-json')
    value: Metadata;
}