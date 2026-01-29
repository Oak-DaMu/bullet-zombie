/**
 * @author Da Mu
 * @version v1.1.0.cn.sy.202508010128
 * @mail 317782199@qq.com
 */
import { Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Cron, SchedulerRegistry, CronExpression } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { v4 as uuidv4 } from 'uuid';
import { TemplateApiGameDistributionService, TemplateApiScheduledTasksService, TemplateApiScheduledTreasureHuntTasksService, TemplateApiGamePlayerService } from '../TemplateApiGameService/TemplateApiGame.service';
import { TemplateApiSocketIoClient } from '../TemplateApiPlugService/TemplateApiSocketIoClient.service';
import { TemplateApiRedisService } from '../TemplateApiPlugService/TemplateApiRedis.service';
import publishSubscrib from '../../utils/publishSubscrib';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';
import * as jsonfile from 'jsonfile';
import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs';

const TH_DATA_TYPE = [
    {
        name: '宝箱',
        type: 'waste',
        weight: 80
    },
    {
        name: '宝箱',
        type: 'legend',
        weight: 20
    }
];

interface quality {
    name: string,
    type: number
};

let FallCount = 0;
let GhostCount = 0;

enum BrainCount {
    waste = 1,
    ordinary = 2,
    rare = 5,
    epic = 10,
    legend = 20
};

let TreasureEqu = {
    Potion: 0,
    Coin: 0,
    Fish: 0,
    Trophy: 0,
    Clip: 0,
    Gun: 0
};

enum SkillTree {
    pumpkinWeapon = 10
};

enum GhostATK {
    norAttack = 10
};

@Injectable()
export class TemplateApiGameRoom {
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger
    public client: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;
    public ghostTask: any;
    public treasure: any;
    private CID: string;
    private clientPlayerId: string;
    private currentlyUniversal: string;
    private privateSceneGameMonstersGhostDataPlayerId: string;
    private readonly filePath: string = path.join(process.cwd(), 'static/game', 'save.json');
    constructor(
        private readonly MOSocketClient: TemplateApiSocketIoClient,
        private readonly distribution: TemplateApiGameDistributionService,
        private readonly ScheduledTasksService: TemplateApiScheduledTasksService,
        private readonly ScheduledTreasureHuntTasksService: TemplateApiScheduledTreasureHuntTasksService,
        private readonly PlayerService: TemplateApiGamePlayerService,
        private readonly redis: TemplateApiRedisService,
        public schedulerRegistry: SchedulerRegistry
    ) {

        /**@description start new game for set privateSceneGameMonstersGhostData playerId & currentlyUniversalplayerId. */
        publishSubscrib.subscribe('privateSceneGameMonstersGhostDataPlayerId', async (id: string) => {
            const z = await this.redis.get(`${this.privateSceneGameMonstersGhostDataPlayerId}_privateSceneGameMonstersGhostData`);

            await this.redis.delete([`${this.privateSceneGameMonstersGhostDataPlayerId}_privateSceneGameMonstersGhostData`]);

            await this.redis.set(`${id}_privateSceneGameMonstersGhostData`, z);
            this.privateSceneGameMonstersGhostDataPlayerId = id;
            this.currentlyUniversal = id;
        });

        /**@description Multiplayer online listen count number room */
        this.MOSocketClient.on('MORoomOnlinePlayerCount', number => {
            this.client.emit('MORoomOnlinePlayerCount', number);
        });

        /**@description Multiplayer online listen player chat room */
        this.MOSocketClient.on('MORoomOnlinePlayerChatMsg', obj => {
            /**@abstract Exclude oneself */
            if (this.CID !== obj.author) {
                const filePath = path.join(process.cwd(), 'static/game/images', 'user.png');
                if (!fs.existsSync(filePath)) throw new NotFoundException('file not found');
                const base64String = fs.readFileSync(filePath, { encoding: 'base64' });
                obj.image = base64String;
                this.client.emit('MOPlayerChatMsg', obj);
            };
        });

        /**@description Multiplayer online listen player image init room */
        this.MOSocketClient.on('MORoomOnlinePlayersImageInitDataMsg', obj => {
            /**@abstract Exclude oneself */
            obj.playersId = obj.playersId.filter((item: any) => JSON.parse(item).author !== this.CID);
            this.client.emit('MORoomOnlinePlayersImageInitData', obj);
        });

        /**@description Multiplayer online listen players image move room */
        this.MOSocketClient.on('MORoomOnlinePlayersImageMoveDataMsg', obj => {
            /**@abstract Exclude oneself */
            if (this.CID !== obj.body.author) {
                this.client.emit('MORoomOnlinePlayersImageMoveData', obj);
            };
        });

        /**@description Multiplayer online listen leave room */
        this.MOSocketClient.on('SomeoneLeftTheRoom', pid => {
            /**@abstract Exclude oneself */
            try {
                if (this.CID !== JSON.parse(pid).author) {
                    if (JSON.parse(pid).author === null) return;
                    const filePath = path.join(process.cwd(), 'static/game/images', 'logo.png');
                    if (!fs.existsSync(filePath)) throw new NotFoundException('file not found');
                    const base64String = fs.readFileSync(filePath, { encoding: 'base64' });
                    this.client.emit('AdvertiseCombatSysMessage', {
                        type: 'text',
                        author: 'DaMu',
                        image: base64String,
                        data: {
                            text: `系统提示：${JSON.parse(pid).playerName} 玩家离开了多人在线/游戏...`
                        }
                    });

                    /**@abstract Exclude oneself and leave other players images */
                    this.client.emit('MORoomOnlineLeaveOtherPlayersImageData', JSON.parse(pid).author);
                };
            } catch (error) {

            };
        });
    };

    // @Cron(CronExpression.EVERY_10_SECONDS, {name: 'ghost'}) 
    async sceneBrushingMonsters() {
        // ------------------------------------------ First execute -----------------------------------------------------
        const playerJson = await jsonfile.readFileSync(this.filePath);
        this.privateSceneGameMonstersGhostDataPlayerId = playerJson.playerDataType.id;

        const json = await this.distribution.randomDistributionOfCircularAreas();
        const z = JSON.parse(json);
        z.zombie.forEach(async (item: { uuid: string; }) => {
            item.uuid = uuidv4();
        });
        this.client.emit('privateSceneGameMonstersGhost', z);
        this.redis.set(`${this.privateSceneGameMonstersGhostDataPlayerId}_privateSceneGameMonstersGhostData`, z);
        this.logger.info({ method: '@TemplateApiGame.room -> class.TemplateApiGameRoom.sceneBrushingMonsters', first: z });
        // ------------------------------------------  Scheduled tasks ---------------------------------------------------
        if (this.schedulerRegistry.doesExist('cron', 'ghost')) {
            this.ghostTask = null;
            this.schedulerRegistry.deleteCronJob('ghost');
        };
        /**
         * @description Manual scheduled tasks
         */
        this.ghostTask = new CronJob(
            CronExpression.EVERY_10_SECONDS,
            async () => {
                const json = await this.distribution.randomDistributionOfCircularAreas();
                const z = JSON.parse(json);
                z.zombie.forEach(async (item: { uuid: string; }) => {
                    item.uuid = uuidv4();
                });
                this.client.emit('privateSceneGameMonstersGhost', z);
                this.redis.set(`${this.privateSceneGameMonstersGhostDataPlayerId}_privateSceneGameMonstersGhostData`, z);
                this.logger.info({ method: '@TemplateApiGame.room -> class.TemplateApiGameRoom.sceneBrushingMonsters', task: z });
            },
            null,
            false,
            'Asia/Shanghai'
        );
        this.schedulerRegistry.addCronJob('ghost', this.ghostTask);

    };

    // @Cron(CronExpression.EVERY_5_MINUTES, {name: 'treasure'}) 
    async sceneTreasureHunt() {
        // ------------------------------------------  Scheduled tasks ---------------------------------------------------
        if (this.schedulerRegistry.doesExist('cron', 'treasure')) {
            this.treasure = null;
            this.schedulerRegistry.deleteCronJob('treasure');
        };
        /**
         * @description treasure scheduled tasks
         */
        this.treasure = new CronJob(
            CronExpression.EVERY_5_MINUTES,
            async () => {
                const t = await this.thCount();
                this.client.emit('privateSceneGameTreasureHunt', t);
                this.redis.set(`${this.currentlyUniversal}_privateSceneGameTreasureHuntDataType`, t);
                this.logger.info({ method: '@TemplateApiGame.room -> class.TemplateApiGameRoom.sceneTreasureHunt', task: t });
            },
            null,
            false,
            'Asia/Shanghai'
        );
        this.schedulerRegistry.addCronJob('treasure', this.treasure);
        this.treasure.start();
    };

    async targetMessage(data: any) {
        const msg = ['消息', '系统提示：未找到任何目标！', '系统提示：目标过远!'];
        const filePath = path.join(process.cwd(), 'static/game/images', 'logo.png');
        if (!fs.existsSync(filePath)) throw new NotFoundException('file not found');
        const base64String = fs.readFileSync(filePath, { encoding: 'base64' });
        this.client.emit('AdvertiseCombatSysMessage', {
            type: 'text',
            author: 'DaMu',
            image: base64String,
            data: {
                text: msg[data]
            }
        });

    };

    async authorInformationAnnouncement(data: any) {
        switch (data) {
            case 'NOT':
                const filePath = path.join(process.cwd(), 'static/game/images', 'logo.png');
                if (!fs.existsSync(filePath)) throw new NotFoundException('file not found');
                const base64String = fs.readFileSync(filePath, { encoding: 'base64' });
                this.client.emit('AdvertiseMessage', {
                    type: 'text',
                    author: 'DaMu',
                    image: base64String,
                    data: {
                        text: `「"您好，${this.client.id}，欢迎来到#弹丸僵尸#游戏世界，如果您在#弹丸僵尸#游戏项目二次开发时或游玩的过程中对游戏感兴趣并有改进建议的地方可以联系作者，@大木 Email: 317782199@qq.com"」`
                    }
                });
                break;
        };
    };

    /**
     * 
     * @param uuid 
     * @returns 
     * @function PumpkinWeaponsAndGhostInteractions
     * @description player atk ghost count.
     */
    async PumpkinWeaponsAndGhostInteractions(uuid: any) {
        const HP = SkillTree.pumpkinWeapon;
        const json = await this.redis.get(`${this.currentlyUniversal}_privateSceneGameMonstersGhostData`);
        if (json === null) return;
        const findItem = json.zombie.find((zombie: { uuid: string; }) => zombie.uuid === uuid);
        findItem.hp = findItem.hp <= 0 ? 0 : (findItem.hp - HP);
        json.zombie.map((item: { uuid: any; }) => {
            if (item.uuid === findItem.uuid) {
                item = findItem;
            };
        });
        const updateFindItem = json.zombie.find((zombie: { uuid: string; }) => zombie.uuid === uuid).hp;
        this.redis.set(`${this.currentlyUniversal}_privateSceneGameMonstersGhostData`, {
            zombie: json.zombie,
            coordinate: json.coordinate
        });

        this.client.emit('ghostBloodBarCount', {
            uuid: uuid,
            count: updateFindItem / 100
        });
    };

    /**
     * 
     * @param uuid 
     * @returns 
     * @function GhostATKAndPlayerInteractions
     * @description ghost atk player count.
     */
    async GhostATKAndPlayerInteractions(uuid: any) {
        const HP = GhostATK.norAttack;
        let p_hp = await this.redis.get(`${this.currentlyUniversal}_playerHP`);
        const p_data = await this.redis.get(`${this.currentlyUniversal}_playerDataType`);
        if (p_hp === null && p_data === null) return;
        const p_uuid = p_data.playerDataType.id;
        if (p_uuid === uuid) {
            p_hp = p_hp <= 0 ? 0 : (p_hp - HP);
            this.redis.set(`${this.currentlyUniversal}_playerHP`, p_hp);
            this.client.emit('playerBloodBarCount', {
                uuid: uuid,
                count: p_hp / 100
            });
        };
    };

    async operateTreasureHuntTask() {
        this.ScheduledTreasureHuntTasksService.listenTask((status: any) => {
            if (!this.treasure || status === null) return;
            this.treasure[status]();
            if (status === 'stop') {
                this.treasure.stop();
                if (this.schedulerRegistry.doesExist('cron', 'treasure')) {
                    this.schedulerRegistry.deleteCronJob('treasure');
                };
                this.treasure = null;
            };
        });
    };

    async operateGhostTask() {
        this.ScheduledTasksService.listenTask((status: any) => {
            if (!this.ghostTask || status === null) return;
            this.ghostTask[status]();
        });
    };

    async createPlayerDataType(playerId: string) {
        try {
            const json = await jsonfile.readFileSync(this.filePath);
            const playerName = json.playerDataType.name;

            const obj: any = await this.PlayerService.createPlayer(playerId, playerName);

            await this.redis.delete([`${this.clientPlayerId}_ghostCount`, `${this.clientPlayerId}_playerBrainCount`, `${this.clientPlayerId}_playerTreasureEqu`]);

            await this.redis.set(`${obj.playerId}_playerBrainCount`, obj.playerBrainCount);
            await this.redis.set(`${obj.playerId}_ghostCount`, obj.ghostCount);
            await this.redis.set(`${obj.playerId}_playerTreasureEqu`, obj.playerTreasureEqu);

            FallCount = obj.playerBrainCount;
            GhostCount = obj.ghostCount;
            TreasureEqu = obj.playerTreasureEqu;

            this.client.emit('SceneGamePlayerInit', {
                playerDataTypeInit: 'OK'
            });
        } catch (error) {

        };
    };

    /**
     * 
     * @param data 
     * @returns 
     * @function createEquipmentPicking
     * @description player pick up brainEqu brain count.
     */
    async createEquipmentPicking(data: any) {
        FallCount = await this.redis.get(`${this.currentlyUniversal}_playerBrainCount`);
        const json = await this.redis.get(`${this.currentlyUniversal}_fallItems`);
        if (json === null) return;
        const jsons = json.flat();
        await Promise.all(jsons.map((item: any) => {
            if (JSON.parse(item).uuid === data) {
                switch (JSON.parse(item).type) {
                    case 'waste':
                        FallCount += BrainCount.waste;
                        this.CreatePickUpBrainSysChatMessage({ name: '垃圾', type: BrainCount.waste });
                        break;
                    case 'ordinary':
                        FallCount += BrainCount.ordinary;
                        this.CreatePickUpBrainSysChatMessage({ name: '普通', type: BrainCount.ordinary });
                        break;
                    case 'rare':
                        FallCount += BrainCount.rare;
                        this.CreatePickUpBrainSysChatMessage({ name: '稀有', type: BrainCount.rare });
                        break;
                    case 'epic':
                        FallCount += BrainCount.epic;
                        this.CreatePickUpBrainSysChatMessage({ name: '史诗', type: BrainCount.epic });
                        break;
                    case 'legend':
                        FallCount += BrainCount.legend;
                        this.CreatePickUpBrainSysChatMessage({ name: '传说', type: BrainCount.legend });
                        break;
                };
            };

        }));

        await this.redis.set(`${this.currentlyUniversal}_playerBrainCount`, FallCount);
        this.client.emit('EquipmentPicking', {
            count: FallCount
        });

    };

    /**
     * 
     * @param data 
     * @returns 
     * @function createTHEquipmentPicking
     * @description player pick up Treasure Hunt equ count.
     */
    async createTHEquipmentPicking(data: any) {
        try {
            const playerJson = await jsonfile.readFileSync(this.filePath);

            TreasureEqu = await this.redis.get(`${this.currentlyUniversal}_playerTreasureEqu`);
            const json = await this.redis.get(`${this.currentlyUniversal}_THFallItems`);
            if (json === null) return;
            const jsons = json.flat();
            await Promise.all(jsons.map((item: any) => {
                if (JSON.parse(item).uuid === data) {
                    const items = JSON.parse(item);
                    TreasureEqu[items.type.key] += 1;
                };

            }));

            await this.redis.set(`${this.currentlyUniversal}_playerTreasureEqu`, TreasureEqu);

            playerJson.playerDataType.TreasureEqu = TreasureEqu;

            jsonfile.writeFileSync(this.filePath, playerJson);

            this.client.emit('THEquipmentPicking', {
                equ: TreasureEqu
            });
        } catch (error) {

        };

    };

    /**
     * 
     * @param uuid 
     * @returns 
     * @function createGameKillGhostCount
     * @description player kil ghost count number.
     */
    async createGameKillGhostCount(uuid: string) {
        const json = await this.redis.get(`${this.currentlyUniversal}_privateSceneGameMonstersGhostData`);
        if (json === null) return;
        const findItem = json.zombie.find((zombie: { uuid: string; }) => zombie.uuid === uuid);

        if (findItem.hp !== 0) return;
        GhostCount += 1;

        await this.redis.set(`${this.currentlyUniversal}_ghostCount`, GhostCount);
        this.client.emit('SceneGameKillGhostCount', {
            count: GhostCount
        });

    };

    async CreatePickUpBrainSysChatMessage(obj: quality) {
        const filePath = path.join(process.cwd(), 'static/game/images', 'logo.png');
        if (!fs.existsSync(filePath)) throw new NotFoundException('file not found');
        const base64String = fs.readFileSync(filePath, { encoding: 'base64' });
        this.client.emit('AdvertisePickUpBrainMessage', {
            type: 'text',
            author: 'DaMu',
            image: base64String,
            data: {
                text: `拾取了脑子，品质 ***${obj.name}***，获得 ${obj.type} 个脑子！`
            }
        });
    };

    async CreateBulletRPSysChatMessage(obj: quality) {
        const filePath = path.join(process.cwd(), 'static/game/images', 'logo.png');
        if (!fs.existsSync(filePath)) throw new NotFoundException('file not found');
        const base64String = fs.readFileSync(filePath, { encoding: 'base64' });
        this.client.emit('AdvertiseBulletRPMessage', {
            type: 'text',
            author: 'DaMu',
            image: base64String,
            data: {
                text: `弹丸击中了 ***${obj.name}***，获得 ${obj.type} 个脑子！`
            }
        });
    };

    /**
     * 
     * @returns 
     * @function createSceneGame2DGetBall
     * @description player play 2D projectile game consume ghost.
     */
    async createSceneGame2DGetBall() {
        const ghostCount = await this.redis.get(`${this.currentlyUniversal}_ghostCount`);

        if (ghostCount === null || GhostCount === 0) return;
        GhostCount -= 1;

        await this.redis.set(`${this.currentlyUniversal}_ghostCount`, GhostCount);
        this.client.emit('SceneGame2DGetBall', {
            count: GhostCount
        });

    };

    /**
     * 
     * @param type 
     * @function createSceneGame2DCountBall
     * @description player play 2D projectile game obtain brain.
     */
    async createSceneGame2DCountBall(type: string) {
        FallCount = await this.redis.get(`${this.currentlyUniversal}_playerBrainCount`);
        switch (type) {
            case 'rp-left':
                FallCount += BrainCount.rare;
                this.CreateBulletRPSysChatMessage({ name: '骷髅山', type: BrainCount.rare });
                break;
            case 'rp-middle':
                FallCount += BrainCount.epic;
                this.CreateBulletRPSysChatMessage({ name: '城堡', type: BrainCount.epic });
                break;
            case 'rp-right':
                FallCount += BrainCount.legend;
                this.CreateBulletRPSysChatMessage({ name: '神秘木屋', type: BrainCount.legend });
                break;
        };

        await this.redis.set(`${this.currentlyUniversal}_playerBrainCount`, FallCount);
        this.client.emit('EquipmentPicking', {
            count: FallCount
        });

    };

    async createSceneGameZombieChat(type: string) {
        const filePath = path.join(process.cwd(), 'static/game/images', 'character_zombie_idle.png');
        if (!fs.existsSync(filePath)) throw new NotFoundException('file not found');
        const base64String = fs.readFileSync(filePath, { encoding: 'base64' });
        let chat = {
            type: 'text',
            author: 'zombie',
            image: base64String,
            data: {
                text: ''
            }
        };
        switch (type) {
            case 'Copywriting-one':
                chat.data.text = '「"艾玛！老哥，你醒了？昨晚我做梦你还欠我两串烤腰子没还呢...对了，你路上是不是看到一堆老弟？目前它们也都刚睡醒，有点蒙圈都，是时候给它们都补补脑子了！"」';
                break;
            case 'Copywriting-two':
                chat.data.text = '「"在来别空两爪子啊，给我整点脑子补补！"」';
                break;
            case 'Copywriting-three':
                chat.data.text = '「"快！把脑子全炫我嘴里！"」';
                break;
            case 'Copywriting-four':
                chat.data.text = '「"嗝——！这是对美食的最高敬意。嗯...快去看看老弟们都有啥变化吧！"」';
                break;
            case 'Copywriting-playerDie':
                chat.data.text = '「"哎~ 咋整的啊！玩个这游戏都挂了？看看代码吧，自己改一改..."」'
        };

        this.client.emit('SceneGameZombieChat', chat);
    };

    async createSceneGameMinerChat(type: string) {
        const filePath = path.join(process.cwd(), 'static/game/images', 'character_maleAdventurer_behindBack.png');
        if (!fs.existsSync(filePath)) throw new NotFoundException('file not found');
        const base64String = fs.readFileSync(filePath, { encoding: 'base64' });
        let chat = {
            type: 'text',
            author: 'miner',
            image: base64String,
            data: {
                text: ''
            }
        };
        switch (type) {
            case 'Copywriting-one':
                chat.data.text = '「"老哥，看到这座小岛了没~ 新鲜出炉拔地而起! v1.1.0.cn.sy.202508010128 正式发布版，您可以在这座小岛上进行寻宝了，献祭点您的幽灵，老夫在这座小岛上给你挖一挖..."」';
                break;
            case 'Copywriting-two':
                chat.data.text = '「"挖呀挖呀挖——意想不到的宝藏！"」';
                break;
        };

        this.client.emit('SceneGameMinerChat', chat);
    };

    /**
     * @function delSceneGameReset
     * @description player leave game scene data reset.
     */
    async delSceneGameReset() {

        FallCount = 0;
        GhostCount = 0;
        TreasureEqu = {
            Potion: 0,
            Coin: 0,
            Fish: 0,
            Trophy: 0,
            Clip: 0,
            Gun: 0
        };

        await this.redis.delete([
            `${this.currentlyUniversal}_privateSceneGameTreasureHuntDataType`,
            `${this.currentlyUniversal}_treasureHuntStatus`,
            `${this.currentlyUniversal}_fallItems`,
            `${this.currentlyUniversal}_refreshGhostStatus`,
            `${this.currentlyUniversal}_THFallItems`,
            `${this.currentlyUniversal}_AI-Error`,
            `${this.currentlyUniversal}_playerTreasureEqu`,
            `${this.currentlyUniversal}_playerBrainCount`,
            `${this.currentlyUniversal}_ghostCount`,
            `${this.currentlyUniversal}_privateSceneGameMonstersGhostData`,
            `${this.currentlyUniversal}_playerDataType`,
            `${this.currentlyUniversal}_playerHP`,
        ]);

    };

    /**
     * @function SceneGameCount
     * @description socket.io client init playerId.
     */
    async SceneGameCount() {
        const json = await jsonfile.readFileSync(this.filePath);
        const playerId = json.playerDataType.id;
        this.clientPlayerId = json.playerDataType.id;
        this.currentlyUniversal = json.playerDataType.id;

        await this.redis.set(`${playerId}_playerBrainCount`, json.playerDataType.brainCount);
        await this.redis.set(`${playerId}_ghostCount`, json.playerDataType.ghostCount);
        await this.redis.set(`${playerId}_playerTreasureEqu`, json.playerDataType.TreasureEqu);

        FallCount = json.playerDataType.brainCount;
        GhostCount = json.playerDataType.ghostCount;
        TreasureEqu = json.playerDataType.TreasureEqu;

        /**@description Multiplayer online client */
        this.MOSocketClient.connect();
    };

    async joinMOSceneGameRoom() {
        /**@description Multiplayer online number of only player */
        this.MOSocketClient.emit('MOpublicGameSceneWorldNOOP', 'NOOP');
    };

    async joinMOSceneGameRoomChat(body: any) {
        this.CID = body.author;

        /**@description Multiplayer online chat */
        this.MOSocketClient.emit('MOpublicGameSceneWorldPC', {
            type: 'playerChat',
            body: body
        });
    };

    async MOSceneGamePlayersImageMoveData(body: any) {
        this.CID = body.author;

        /**@description Multiplayer online players image data  */
        this.MOSocketClient.emit('MOSceneGamePlayersImageData', {
            type: 'playerImageMoveData',
            body: body
        });
    };

    async MOSceneGamePlayersImageInitData(body: any) {
        try {
            this.CID = body.author;
            const json = await jsonfile.readFileSync(this.filePath);
            body.playerName = json.playerDataType.name;

            /**@description Multiplayer online players image data */
            this.MOSocketClient.emit('MOSceneGamePlayersImageData', {
                type: 'playerImageInitData',
                body: body
            });
        } catch (error) {

        };
    };

    async getTaskRemainingTime(taskName: string) {
        if (!this[taskName]) return this.client.emit('privateSceneGameTreasureHuntTimer', -1);;

        const nextTime = this[taskName].nextDate().toJSDate();
        const now = new Date();
        const timer = Math.floor((nextTime.getTime() - now.getTime()) / 1000);
        this.client.emit('privateSceneGameTreasureHuntTimer', timer);
    };

    async thCount() {
        const totalWeight = TH_DATA_TYPE.reduce((sum, item) => sum + item.weight, 0);
        const random = crypto.randomInt(0, totalWeight);
        let cumulativeWeight = 0;
        for (const item of TH_DATA_TYPE) {
            cumulativeWeight += item.weight;
            if (random < cumulativeWeight) {
                return item;
            };
        };
    };

    async leaveMOSceneGameRoom(CID: string) {
        /** Multiplayer online */
        this.CID = CID;

        try {
            const json = await jsonfile.readFileSync(this.filePath);
            const name = json.playerDataType.name;
            json.playerDataType.online = false;
            jsonfile.writeFileSync(this.filePath, json)
            const data = {
                playerName: name,
                author: CID
            };

            /**@description Multiplayer online players image leave */
            this.MOSocketClient.emit('MOpublicGameSceneWorldLeaveDel', { type: 'leave', room: 'MORoomOnlinePlayer', chatRoom: 'MORoomOnlinePlayerChat', playersImageDataRoom: 'MORoomOnlinePlayersImageData', PID: JSON.stringify(data) });
        } catch (error) {

        };
    };

    async disconnectMultiplayerOnline() {
        /** Multiplayer online */
        this.MOSocketClient.disconnect();
    };

    async delMultiplayerOnlineplayersId() {
        /** Multiplayer online */
        try {
            const json = await jsonfile.readFileSync(this.filePath);
            const name = json.playerDataType.name;
            const data = {
                playerName: name,
                author: this.CID
            };

            await this.redis.lrem('playersId', 0, JSON.stringify(data));
        } catch (error) {

        };
    };

    /** 容灾处理 */
    /**  Multiplayer online Room disaster recovery */
    async delMultiOnlineDisasterRecovery() {
        /** Multiplayer online */
        await this.redis.rpush('DisasterRecoveryPlayer', this.CID);
    };

};
