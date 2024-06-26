import { Module } from '@nestjs/common';
import { ReplicasetController } from './replicaset.controller';
import { ReplicasetService } from './replicaset.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [ReplicasetController],
  providers: [ReplicasetService]
})
export class ReplicasetModule {}
