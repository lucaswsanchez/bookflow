import { INestApplication } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';

export const DEMO_SLUG = 'barberia-costanera';
export const ADMIN = { email: 'admin@demo.com', password: 'Admin123!' };
export const STAFF = { email: 'staff@demo.com', password: 'Staff123!' };

export async function createTestApp(): Promise<INestApplication> {
  process.env.JWT_ACCESS_SECRET ??= 'e2e-access-secret';
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({ logger: false });
  configureApp(app);
  await app.init();
  return app;
}

export async function login(app: INestApplication, creds: { email: string; password: string }) {
  const res = await request(app.getHttpServer())
    .post('/auth/login')
    .set('X-Forwarded-For', `10.1.0.${Math.floor(Math.random() * 200) + 1}`)
    .send(creds)
    .expect(200);
  return res.body as { accessToken: string; refreshToken: string };
}
