import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('health', () => {
    it('returns health status', () => {
      expect(appController.getHealth()).toEqual({ status: 'ok' });
    });
  });

  describe('demo login', () => {
    it('returns a demo token and the provided name', () => {
      expect(appController.demoLogin({ name: 'Ян' })).toEqual({
        accessToken: 'demo-token',
        user: { id: 'demo-user', name: 'Ян' },
      });
    });

    it('uses a default name when the provided name is blank', () => {
      expect(appController.demoLogin({ name: '   ' })).toEqual({
        accessToken: 'demo-token',
        user: { id: 'demo-user', name: 'Демо-пользователь' },
      });
    });

    describe('me', () => {
      it('returns the demo user profile', () => {
        expect(appController.getMe()).toEqual({
          id: 'demo-user',
          name: 'Демо-пользователь',
        });
      });
    });
  });
});
