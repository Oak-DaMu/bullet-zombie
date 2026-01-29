/**
 * @author Da Mu
 * @version v1.1.0.cn.sy.202508010128
 * @mail 317782199@qq.com
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Transport, ClientsModule } from '@nestjs/microservices';
import { Redis } from 'ioredis';
import { TemplateApiController } from './TemplateApi.controller';
import { TemplateApiService } from './TemplateApi.service';
import { TemplateApiRedisService } from './TemplateApiPlugService/TemplateApiRedis.service';
import { TemplateApiSvgCaptchaService } from './TemplateApiPlugService/TemplateApiSvgCode.service';
import { TemplateApiQrService } from './TemplateApiPlugService/TemplateApiQr.service';
import { TemplateApiMailService } from './TemplateApiPlugService/TemplateApiEmail.service';
import { TemplateJoinMultiplayerOnline, TemplatePlayerUseWear, TemplateSwitchGameMode, TemplateCreatePlayerRole, TemplateApiGameMarblesService, TemplateApiGameTreasureService, TemplateApiScheduledTreasureHuntTasksService, TemplateApiGameSaveFileService, TemplateBackPack, TemplateApiGameSkillListService, TemplateApiScheduledTasksService, TemplateApiGamePlayerService } from './TemplateApiGameService/TemplateApiGame.service';
import { TemplateApiAIService } from './TemplateApiAIService/TemplateApiAI.service';
import { JwtStrategy } from './TemplateApiJWT/JWT.strategy';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from '../utils/winston.config';
import * as yaml from 'js-yaml';
import { readFileSync } from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), '/', 'config.yml');
const yamlLoad: any = yaml.load(readFileSync(filePath, 'utf-8'));


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env'
    }),
    // log日志配置
    WinstonModule.forRoot(winstonConfig),
    // redis配置
    ClientsModule.register([
      {
        name: process.env.TEMPLATE_REDIS_NAME || yamlLoad.redisServer.name,
        transport: Transport.REDIS,
        options: {
          host: process.env.TEMPLATE_REDIS_HOST || yamlLoad.redisServer.host,
          password: process.env.TEMPLATE_REDIS_SECRET || yamlLoad.redisServer.secret
        }
      }
    ]),
  ],
  controllers: [TemplateApiController],
  providers: [TemplateJoinMultiplayerOnline, TemplatePlayerUseWear, TemplateSwitchGameMode, TemplateCreatePlayerRole, TemplateApiService, TemplateApiRedisService, TemplateApiGameTreasureService, TemplateApiScheduledTreasureHuntTasksService, JwtStrategy, Redis, TemplateApiSvgCaptchaService, TemplateBackPack, TemplateApiQrService, TemplateApiGameMarblesService, TemplateApiGameSaveFileService, TemplateApiGameSkillListService, TemplateApiMailService, TemplateApiAIService, TemplateApiScheduledTasksService, TemplateApiGamePlayerService],
})
export class TemplateApiModule { };
