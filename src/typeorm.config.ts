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

export const deploymentDBConfig: TypeOrmModuleOptions = {
  name: 'deploymentConnection',
  type: 'sqlite',
  database: 'src/sqlite/deployment.sqlite',
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