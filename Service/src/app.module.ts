/**
 * @author Da Mu
 * @version v1.1.0.cn.sy.202508010128
 * @mail 317782199@qq.com
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import config from './shared/config';
import { SharedModule } from './shared/shared.module';
import { AppController } from './app.controller';
import { TemplateApiModule } from './TemplateApi/TemplateApi.module';
import { TemplateApiChatGateway } from './TemplateApi/TemplateApiGateway/TemplateApiChat.gateway';
import { TemplateApiGameDistributionService, TemplateCreatePlayerRole, TemplateApiScheduledTasksService, TemplateApiScheduledTreasureHuntTasksService, TemplateApiGamePlayerService } from './TemplateApi/TemplateApiGameService/TemplateApiGame.service';
import { TemplateApiGameRoom } from './TemplateApi/TemplateApiGameSocketRoom/TemplateApiGame.room';
import { ScheduleModule } from '@nestjs/schedule';
import { Redis } from 'ioredis';
import { TemplateApiRedisService } from './TemplateApi/TemplateApiPlugService/TemplateApiRedis.service'
import { Transport, ClientsModule } from '@nestjs/microservices';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './utils/winston.config';
import { TemplateApiSocketIoClient } from './TemplateApi/TemplateApiPlugService/TemplateApiSocketIoClient.service';
import * as yaml from 'js-yaml';
import { readFileSync } from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), '/', 'config.yml');
const yamlLoad: any = yaml.load(readFileSync(filePath, 'utf-8'));


@Module({
  imports: [
    // 导入全局变量配置
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      load: [config],
    }),
    // 静态资源服务配置
    ServeStaticModule.forRoot({
      serveRoot: '/static',
      rootPath: join(__dirname, '..', 'static'),
    }, {
      serveRoot: '/game',
      rootPath: join(__dirname, '..', 'static/game'),
    }),
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
    // log日志配置
    WinstonModule.forRoot(winstonConfig),
    SharedModule,
    TemplateApiModule,
    // 定时任务
    ScheduleModule.forRoot()
  ],
  controllers: [AppController],
  providers: [TemplateApiSocketIoClient, TemplateCreatePlayerRole, TemplateApiChatGateway, TemplateApiGameDistributionService, Redis, TemplateApiRedisService, TemplateApiGameRoom, TemplateApiScheduledTasksService, TemplateApiScheduledTreasureHuntTasksService, TemplateApiGamePlayerService],
})
export class AppModule { }
