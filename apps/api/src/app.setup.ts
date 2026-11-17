import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * Shared app configuration used by both `main.ts` and the e2e tests,
 * so tests exercise exactly the same pipes, filters and CORS rules.
 */
export function configureApp(app: NestExpressApplication) {
  // Render (and most PaaS) sit behind a proxy: trust it so rate limiting sees the real client IP.
  app.set('trust proxy', 1);

  const origins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({ origin: origins, credentials: false });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('BookFlow API')
    .setDescription(
      'REST API for BookFlow — appointment booking and management for small businesses.\n\n' +
        'Use `POST /auth/login` with a demo user (`admin@demo.com` / `Admin123!`), ' +
        'then click **Authorize** and paste the `accessToken`.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'BookFlow API docs',
    swaggerOptions: { persistAuthorization: true },
  });
}
