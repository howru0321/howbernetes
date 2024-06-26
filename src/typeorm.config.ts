import { TypeOrmModuleOptions } from '@nestjs/typeorm';

//TypeOrm : Object-DB mapping
export const containerDBConfig: TypeOrmModuleOptions = {
  name: 'containerConnection',
  type: 'sqlite',
  database: 'src/sqlite/container.sqlite',
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  synchronize: true,
};

export const podDBConfig: TypeOrmModuleOptions = {
  name: 'podConnection',
  type: 'sqlite',
  database: 'src/sqlite/pod.sqlite',
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  synchronize: true,
};

export const replicasetDBConfig: TypeOrmModuleOptions = {
  name: 'replicasetConnection',
  type: 'sqlite',
  database: 'src/sqlite/replicaset.sqlite',
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  synchronize: true,
};

export const workernodeDBConfig: TypeOrmModuleOptions = {
  name: 'workernodeConnection',
  type: 'sqlite',
  database: 'src/sqlite/workernode.sqlite',
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  synchronize: true,
};