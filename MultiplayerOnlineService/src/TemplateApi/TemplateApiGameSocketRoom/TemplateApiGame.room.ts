/**
 * @author Da Mu
 * @version v1.1.0.cn.sy.202508010128
 * @mail 317782199@qq.com
 */
import { Server, Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { Injectable, Inject, forwardRef, NotFoundException } from '@nestjs/common';
import { Cron, SchedulerRegistry, CronExpression } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { v4 as uuidv4 } from 'uuid';
import { TemplateApiRedisService } from '../TemplateApiPlugService/TemplateApiRedis.service';
import { TemplateApiChatGateway } from '../TemplateApiGateway/TemplateApiChat.gateway';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';
import * as jsonfile from 'jsonfile';
import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs';


@Injectable()
export class TemplateApiGameRoom {
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger
    public client: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;
    public server: Server;
    public NumberOfOnlinePlayer: number;
    private readonly filePath: string = path.join(process.cwd(), 'static/game', 'save.json');
    constructor(
        @Inject(forwardRef(() => TemplateApiChatGateway))
        private readonly chatGateway: TemplateApiChatGateway,
        private readonly redis: TemplateApiRedisService,
        public schedulerRegistry: SchedulerRegistry
    ) {
        this.NumberOfOnlinePlayer = 0;
    };

    async publicGameSceneWorldNOOP() {
        try {
            this.client.join('MORoomOnlinePlayer');
            this.client.join('MORoomOnlinePlayerChat');
            this.client.join('MORoomOnlinePlayersImageData');

            const NumberOfOnlinePlayer = await this.redis.get('MONumber_of_online_player');
            
            this.server.to('MORoomOnlinePlayer').emit('MORoomOnlinePlayerCount', NumberOfOnlinePlayer);
        } catch (error) {

        };
    };

    async publicGameSceneWorldPC(body: any) {
        try {
            this.server.to('MORoomOnlinePlayerChat').emit('MORoomOnlinePlayerChatMsg', body);
        } catch (error) {

        };
    };

    async publicGameScenePlayersImageInit(body: any) {
        try {
            const data = {playerName: body.body.playerName, author: body.body.author};
            await this.redis.rpush('playersId', JSON.stringify(data));
            body.playersId = await this.redis.getAllElements('playersId');

            this.server.to('MORoomOnlinePlayersImageData').emit('MORoomOnlinePlayersImageInitDataMsg', body);
        } catch (error) {

        };
    };

    async publicGameScenePlayersImageMove(body: any) {
        try {
            this.server.to('MORoomOnlinePlayersImageData').emit('MORoomOnlinePlayersImageMoveDataMsg', body);
        } catch (error) {

        };
    };

    async publicGameSceneWorldDisRoom(body: any) {
        try {
            if (this.client.rooms.has(body.room)) this.client.leave(body.room);
            if (this.client.rooms.has(body.chatRoom)) this.client.leave(body.chatRoom);
            if (this.client.rooms.has(body.playersImageDataRoom)) this.client.leave(body.playersImageDataRoom);

            if (!this.client.rooms.has(body.room)) {
                await this.redis.lrem('playersId', 0, body.PID);

                this.server.emit('SomeoneLeftTheRoom', body.PID);
            };
        } catch (error) {

        };
    };

};
