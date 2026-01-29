/**
 * @author Da Mu
 * @version v1.1.0.cn.sy.202508010128
 * @mail 317782199@qq.com
 */
import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TemplateApiGameRoom } from '../TemplateApiGameSocketRoom/TemplateApiGame.room';
import { TemplateApiRedisService } from '../TemplateApiPlugService/TemplateApiRedis.service';
import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';


@WebSocketGateway({
    path: '/api/v1/ws',
    cors: {
        origin: '*'
    },
})
@Injectable()
export class TemplateApiChatGateway {
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger
    constructor(
        /**
         * @description Solving the problem of dependency injection and mutual cyclic dependencies
         */
        @Inject(forwardRef(() => TemplateApiGameRoom))
        private readonly gameRoom: TemplateApiGameRoom,
        private readonly redis: TemplateApiRedisService
    ) { };
    @WebSocketServer()
    server: Server;

    async handleConnection(@ConnectedSocket() client: Socket) {
        console.log(`APPService socket.io connect: ${client.id}`);

        this.gameRoom.NumberOfOnlinePlayer = await this.redis.incr('MONumber_of_online_player');
        if (this.gameRoom.NumberOfOnlinePlayer === 1) {
            await this.redis.expire('MONumber_of_online_player', 86400);
        };

        /** check players Abnormal exit Disaster recovery processing */
        const players = await this.redis.getAllElements('DisasterRecoveryPlayer');
        if (players !== null) {
            players.map(async id => {
                this.server.emit('SomeoneLeftTheRoom', id);
                await this.redis.lrem('DisasterRecoveryPlayer', 0 ,id);
            });
        };

        this.logger.info({ event: 'socketConnection', clientId: `${client.id}` });
    };

    async handleDisconnect(@ConnectedSocket() client: Socket) {
        console.log(`APPService socket.io disconnect: ${client.id}`);

        let count = await this.redis.decr('MONumber_of_online_player');

        if (count < 0) {
            count = 0;
            await this.redis.set('MONumber_of_online_player', 0);
        };

        this.gameRoom.NumberOfOnlinePlayer = count;
        this.logger.info({ event: 'socketDisconnect', clientId: `${client.id}` });
    };

    /**
     * 
     * @param client
     * @param data
     * @description Multiplayer online Number of online player
     */
    @SubscribeMessage('MOpublicGameSceneWorldNOOP')
    handleMONOOP(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: string,
    ): void {
        if (data === 'NOOP') {
            this.gameRoom.client = client;
            this.gameRoom.server = this.server;
            this.gameRoom.publicGameSceneWorldNOOP();
        };
    };

    /**
     * 
     * @param client 
     * @param data 
     * @description Multiplayer online chat
     */
    @SubscribeMessage('MOpublicGameSceneWorldPC')
    handleMOPC(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: any
    ): void {
        let body: any;
        try {
            body = JSON.parse(data);
        } catch (error) {
            body = data;
        };

        if (body.type === 'playerChat') {
            this.gameRoom.client = client;
            this.gameRoom.publicGameSceneWorldPC(body.body);
        };
    };

    /**
     * 
     * @param client 
     * @param data 
     * @description Multiplayer online chat
     */
    @SubscribeMessage('MOSceneGamePlayersImageData')
    handlePlayersImageData(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: any
    ): void {
        let body: any;
        try {
            body = JSON.parse(data);
        } catch (error) {
            body = data;
        };

        if (body.type === 'playerImageInitData') {
            this.gameRoom.client = client;
            this.gameRoom.publicGameScenePlayersImageInit(body);
        };

        if (body.type === 'playerImageMoveData') {
            this.gameRoom.client = client;
            this.gameRoom.publicGameScenePlayersImageMove(body);
        };
    };

    /**
     * 
     * @param client 
     * @param data 
     * @description leave room
     */
    @SubscribeMessage('MOpublicGameSceneWorldLeaveDel')
    handleGMOLeave(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: any
    ): void {
        let body: any;
        try {
            body = JSON.parse(data);
        } catch (error) {
            body = data;
        };

        if (body.type === 'leave') {
            this.gameRoom.client = client;
            this.gameRoom.publicGameSceneWorldDisRoom(body);
        };
    };

};