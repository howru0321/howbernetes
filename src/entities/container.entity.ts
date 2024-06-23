import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class Container {
    @PrimaryColumn()
    key: string;
  
    @Column('text')
    value: string;
}