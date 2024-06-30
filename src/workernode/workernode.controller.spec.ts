import { Test, TestingModule } from '@nestjs/testing';
import { WorkernodeController } from './workernode.controller';
import { WorkernodeService } from './workernode.service';

describe('WorkernodeController', () => {
  let workernodeController: WorkernodeController;
  let workernodeService: WorkernodeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkernodeController],
      providers: [WorkernodeService],
    }).compile();

    workernodeController = module.get<WorkernodeController>(WorkernodeController);
    workernodeService = module.get<WorkernodeService>(WorkernodeService);
  });

  it('should be defined', () => {
    expect(workernodeController).toBeDefined();
  });
});
