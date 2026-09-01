import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });

    it('should return root service metadata', () => {
      const root = appController.getRoot();
      expect(root.status).toBe('ok');
      expect(root.service).toBe('fmea-backend');
    });
  });

  describe('health', () => {
    it('should return health status ok', async () => {
      const health = await appController.getHealth();
      expect(health.status).toBe('ok');
      expect(health.database).toBe('connected');
    });
  });
});
