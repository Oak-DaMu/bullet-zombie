/**
 * @author Da Mu
 * @version v1.1.0.cn.sy.202508010128
 * @mail 317782199@qq.com
 */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './shared/interceptors/response.interceptor';
import { LoggingInterceptor } from './shared/interceptors/logger.interceptor';
import * as yaml from 'js-yaml';
import { readFileSync } from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), '/', 'config.yml');
const yamlLoad: any = yaml.load(readFileSync(filePath, 'utf-8'));

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  // Set interface prefix
  app.setGlobalPrefix(process.env.API_PREFIX || yamlLoad.localService.apiPrefix);

  app.useGlobalPipes(
    new ValidationPipe({
      // Skip the validation of properties with null or undefined values in the validation object. Please refer to the complete configuration document: https://docs.nestjs.cn
      skipNullProperties: true,
      stopAtFirstError: true,
      transform: true,
    }),
  );

  // Add a global data response interceptor
  app.useGlobalInterceptors(
    new ResponseInterceptor(),
    new LoggingInterceptor(),
  );

  // Version number configuration
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Interface document configuration
  // http://localhost:3006/docs
  const isTest = process.env.NODE_ENV === 'test';
  if (isTest) {
    const options = new DocumentBuilder()
      .setTitle('接口文档')
      .setVersion('1.0.0')
      // .addTag('Template')
      .build();
    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup('docs', app, document);
  }

  // Start Service
  await app.listen(process.env.PORT || yamlLoad.localService.port);
}
bootstrap();
