import { Test, TestingModule } from '@nestjs/testing';
import { WorkernodeService } from './workernode.service';

describe('WorkernodeService', () => {
  let workernodeService: WorkernodeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WorkernodeService],
    }).compile();

    workernodeService = module.get<WorkernodeService>(WorkernodeService);
  });

  it('should be defined', () => {
    expect(workernodeService).toBeDefined();
  });

  // Add more tests here
});
