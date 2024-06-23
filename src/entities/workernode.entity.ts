import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class WorkerNode {
    @PrimaryColumn()
    key: string;
  
    @Column('text')
    value: string;
}