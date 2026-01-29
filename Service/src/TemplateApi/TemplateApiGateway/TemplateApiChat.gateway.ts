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
import { forwardRef, Inject, OnApplicationShutdown } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';

let CID = '';

@WebSocketGateway({
    path: '/api/v1/ws',
    cors: {
        origin: '*'
    },
})
export class TemplateApiChatGateway implements OnApplicationShutdown {
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger
    constructor(
        /**
         * @description Solving the problem of dependency injection and mutual cyclic dependencies
         */
        @Inject(forwardRef(() => TemplateApiGameRoom))
        private readonly gameRoom: TemplateApiGameRoom
    ) { }

    onApplicationShutdown(signal?: string) {
        this.gameRoom.delSceneGameReset();
        /** Multiplayer online */
        this.gameRoom.delMultiplayerOnlineplayersId();
        this.gameRoom.delMultiOnlineDisasterRecovery();

        this.logger.info({ event: 'onApplicationShutdown', signal: `${signal}` });
    };

    @WebSocketServer()
    server: Server;

    async handleConnection(@ConnectedSocket() client: Socket) {
        console.log(`APP connect: ${client.id}`);

        CID = client.id;
        this.gameRoom.SceneGameCount();
    };

    handleDisconnect(@ConnectedSocket() client: Socket) {
        console.log(`APP disconnect: ${client.id}`);

        if (this.gameRoom.schedulerRegistry.doesExist('cron', 'ghost')) {
            this.gameRoom.ghostTask = null;
            this.gameRoom.schedulerRegistry.deleteCronJob('ghost');
        };
        if (this.gameRoom.schedulerRegistry.doesExist('cron', 'treasure')) {
            this.gameRoom.treasure = null;
            this.gameRoom.schedulerRegistry.deleteCronJob('treasure');
        };

        this.gameRoom.delSceneGameReset();
        /** Multiplayer online */
        this.gameRoom.delMultiplayerOnlineplayersId();
        this.gameRoom.disconnectMultiplayerOnline();
        this.gameRoom.leaveMOSceneGameRoom(CID);

        this.logger.info({ event: 'socketDisconnect', clientId: `${client.id}` });
    };

    /**
     * 
     * @param client 
     * @param data 
     * @description About Author Information
     */
    @SubscribeMessage('AdvertiseMessage')
    handleMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: string,
    ): void {
        this.gameRoom.client = client;
        this.gameRoom.authorInformationAnnouncement(data);
    };

    /**
     * 
     * @param client 
     * @param data 
     * @description Regarding system message prompts
     */
    @SubscribeMessage('AdvertiseCombatSysMessage')
    handleCombatSysMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: string,
    ): void {
        this.gameRoom.client = client;
        this.gameRoom.targetMessage(data);
    };

    /**
     * 
     * @param client 
     * @param data 
     * @description Monster based methods in private scene games
     */
    @SubscribeMessage('privateSceneGameMonsters')
    handleGame(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: string,
    ): void {
        /** Create Zombies */
        if (data === 'BM') {
            this.gameRoom.client = client;
            this.gameRoom.sceneBrushingMonsters();
        };

        /** Refresh Zombies */
        if (data === 'LS') {
            this.gameRoom.operateGhostTask();
        };
    };

    /**
     * 
     * @param client 
     * @param data 
     * @description Treasure Hunt based methods in private scene games
     */
    @SubscribeMessage('privateSceneGameTreasureHunt')
    handleTreasureHunt(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: string,
    ): void {
        /** Create treasure task */
        if (data === 'TH') {
            this.gameRoom.client = client;
            this.gameRoom.sceneTreasureHunt();
        };

        /** Get treasure timer */
        if (data === 'TIMER') {
            this.gameRoom.client = client;
            this.gameRoom.getTaskRemainingTime('treasure');
        };

        /** Del treasure timer */
        if (data === 'DEL') {
            this.gameRoom.client = client;
            this.gameRoom.operateTreasureHuntTask();
        };
    };

    /**
     * 
     * @param client 
     * @param data 
     * @description Regarding the calculation of ghost blood strips in Private scene games
     */
    @SubscribeMessage('privateSceneGameGhostBloodBar')
    handleGameBloodBar(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: any
    ): void {
        let body: any;
        try {
            body = JSON.parse(data);
        } catch (error) {
            body = data;
        };

        /** Blood bar count */
        if (body.type === 'BC') {
            this.gameRoom.client = client;
            this.gameRoom.PumpkinWeaponsAndGhostInteractions(body.body);
        };
    };

    /**
     * 
     * @param client 
     * @param data 
     * @description Regarding the calculation of player blood strips in Private scene games
     */
    @SubscribeMessage('privateSceneGamePlayerBloodBar')
    handleGamePlayerBloodBar(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: any
    ): void {
        let body: any;
        try {
            body = JSON.parse(data);
        } catch (error) {
            body = data;
        };

        /** Blood bar count */
        if (body.type === 'BC') {
            this.gameRoom.client = client;
            this.gameRoom.GhostATKAndPlayerInteractions(body.body);
        };
    };

    /**
     * 
     * @param client 
     * @param data 
     * @description Regarding the initialization status of game scene players
     */
    @SubscribeMessage('SceneGamePlayerInit')
    handleSceneGameInit(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: string,
    ): void {
        if (data === 'NEW') {
            this.gameRoom.client = client;
            this.gameRoom.createPlayerDataType(CID);
        };
    };

    /**
     * 
     * @param client 
     * @param data 
     * @description About picking up equipment in game scenes
     */
    @SubscribeMessage('SceneGameEquipmentPicking')
    handleSceneGameEquipmentPicking(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: any,
    ): void {
        let body: any;
        try {
            body = JSON.parse(data);
        } catch (error) {
            body = data;
        };

        if (body.type === 'EP') {
            this.gameRoom.client = client;
            this.gameRoom.createEquipmentPicking(body.body);
        };

        if (body.type === 'THEP') {
            this.gameRoom.client = client;
            this.gameRoom.createTHEquipmentPicking(body.body);
        };
    };

    /**
     * 
     * @param client 
     * @param data 
     * @description About Kill Ghost Counting in Game Scenarios
     */
    @SubscribeMessage('SceneGameKillGhostCount')
    handleSceneGameKillGhostCount(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: any,
    ): void {
        let body: any;
        try {
            body = JSON.parse(data);
        } catch (error) {
            body = data;
        };

        if (body.type === 'KG') {
            this.gameRoom.client = client;
            this.gameRoom.createGameKillGhostCount(body.body);
        };
    };

    /**
     * 
     * @param client 
     * @param data 
     * @description About obtaining Ball in handheld mode in game scenes
     */
    @SubscribeMessage('SceneGame2DGetBall')
    handleSceneGame2DGetBall(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: string,
    ): void {
        if (data === 'GB') {
            this.gameRoom.client = client;
            this.gameRoom.createSceneGame2DGetBall();
        };
    };

    /**
     * 
     * @param client 
     * @param data 
     * @description Regarding the bullet hitting RP to obtain brain in game scenes
     */
    @SubscribeMessage('SceneGame2DCountBall')
    handleSceneGame2DCountBall(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: any,
    ): void {
        let body: any;
        try {
            body = JSON.parse(data);
        } catch (error) {
            body = data;
        };

        if (body.type === 'RP') {
            this.gameRoom.client = client;
            this.gameRoom.createSceneGame2DCountBall(body.body);
        };
    };

    /**
     * 
     * @param client 
     * @param data 
     * @description Regarding zombie dialogues in game scenes
     */
    @SubscribeMessage('SceneGameZombieChat')
    handleSceneGameZombieChat(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: any,
    ): void {
        let body: any;
        try {
            body = JSON.parse(data);
        } catch (error) {
            body = data;
        };

        if (body.type === 'talk') {
            this.gameRoom.client = client;
            this.gameRoom.createSceneGameZombieChat(body.body);
        };
    };

    /**
     * 
     * @param client 
     * @param data 
     * @description Regarding Miner dialogues in game scenes
     */
    @SubscribeMessage('SceneGameMinerChat')
    handleSceneGameMinerChat(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: any,
    ): void {
        let body: any;
        try {
            body = JSON.parse(data);
        } catch (error) {
            body = data;
        };

        if (body.type === 'talk') {
            this.gameRoom.client = client;
            this.gameRoom.createSceneGameMinerChat(body.body);
        };
    };

    /**
     * 
     * @param client 
     * @param data 
     * @description join Multiplayer online room
     */
    @SubscribeMessage('JoinMOSceneGameRoom')
    handleJoinMOSceneGameRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: any,
    ): void {
        let body: any;
        try {
            body = JSON.parse(data);
        } catch (error) {
            body = data;
        };

        if (body.type === 'join') {
            this.gameRoom.client = client;
            this.gameRoom.joinMOSceneGameRoom();
        };

        if (body.type === 'chat') {
            this.gameRoom.client = client;
            this.gameRoom.joinMOSceneGameRoomChat(body.body);
        };
    };

    /**
     * 
     * @param client 
     * @param data 
     * @description join Multiplayer online room
     */
    @SubscribeMessage('leaveMOSceneGameRoom')
    handleLeaveMOSceneGameRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: any,
    ): void {
        let body: any;
        try {
            body = JSON.parse(data);
        } catch (error) {
            body = data;
        };

        if (body.type === 'leave') {
            this.gameRoom.client = client;
            this.gameRoom.leaveMOSceneGameRoom(CID);
        };
    };

    /**
     * 
     * @param client 
     * @param data 
     * @description join Multiplayer online player chate message room
     */
    @SubscribeMessage('playerChatMsg')
    handlePlayerChatMsg(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: any,
    ): void {
        let body: any;
        try {
            body = JSON.parse(data);
        } catch (error) {
            body = data;
        };

        if (body.type === 'PMSG') {
            this.gameRoom.client = client;
            body.body.author = CID;
            this.gameRoom.joinMOSceneGameRoomChat(body.body);
        };
    };

    /**
     * 
     * @param client 
     * @param data 
     * @description Multiplayer online players image room
     */
    @SubscribeMessage('playersImageData')
    handlePlayersImageData(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: any,
    ): void {
        let body: any;
        try {
            body = JSON.parse(data);
        } catch (error) {
            body = data;
        };

        if (body.type === 'init') {
            this.gameRoom.client = client;
            body.body.author = CID;
            this.gameRoom.MOSceneGamePlayersImageInitData(body.body);
        };

        if (body.type === 'move') {
            this.gameRoom.client = client;
            body.body.author = CID;
            this.gameRoom.MOSceneGamePlayersImageMoveData(body.body);
        };
    };

};