/**
 * @author Da Mu
 * @version v1.1.0.cn.sy.202508010128
 * @mail 317782199@qq.com
 */
import { Injectable, HttpException, HttpStatus, NotFoundException, Inject } from '@nestjs/common';
import { TemplateApiFall, TemplateApiTHFall, TemplateApiGame, TemplateApiGameCreatePlayerRole } from '../TemplateApi.dto';
import { TemplateApiRedisService } from '../TemplateApiPlugService/TemplateApiRedis.service';
import publishSubscrib from '../../utils/publishSubscrib';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';
import * as jsonfile from 'jsonfile';
import { join } from 'path';
import * as crypto from 'crypto';
import * as fs from 'fs';

interface marblesType {
    name: string,
    type: string,
    weight: number
};

interface zombieType {
    name: string,
    type: string,
    quantity: number
};

interface centerType {
    x: number,
    z: number
};

interface coordinateType {
    name: string,
    coordinate: {
        x: number,
        z: number
    }
};

interface zombieDataType {
    hp: number,
    name: string,
    atk: number,
    type: string,
    weight: number
};

interface playerDataType {
    id: string,
    hp: number,
    name: string,
    brainCount: number,
    ghostCount: number,
    TreasureEqu: {
        Potion: number,
        Coin: number,
        Fish: number,
        Trophy: number,
        Clip: number,
        Gun: number,
        Lantern: number
    },
    online: boolean,
    dayAndNight: boolean
};

interface treasureType {
    id: string,
    key: string,
    name: string,
    weight: number
};

interface treasureItemsRandomQuantity {
    type: string,
    quantity: number
};

class Marbles {
    private readonly _marblesType: Array<marblesType>;
    constructor() {
        this._marblesType = [
            {
                name: '脑子',
                type: 'waste',
                weight: 60
            },
            {
                name: '脑子',
                type: 'ordinary',
                weight: 20
            },
            {
                name: '脑子',
                type: 'rare',
                weight: 10
            },
            {
                name: '脑子',
                type: 'epic',
                weight: 9.5
            },
            {
                name: '脑子',
                type: 'legend',
                weight: .5
            },
        ];

    };

    async count() {

        const totalWeight = this._marblesType.reduce((sum, item) => sum + item.weight, 0);
        const safeMax = Math.floor(totalWeight);
        const random = crypto.randomInt(0, safeMax);
        let cumulativeWeight = 0;
        for (const item of this._marblesType) {
            cumulativeWeight += item.weight;
            if (random < cumulativeWeight) {
                return item.type;
            };
        };
        return null;

    };


};

class Zombie {
    protected _zombieDataType: Array<zombieDataType>;
    protected _zombieName: string;
    constructor() {
        this._zombieName = '幽灵';
        this._zombieDataType = [
            {
                hp: 100,
                name: '幽灵',
                atk: 10,
                type: 'waste',
                weight: 90
            },
            {
                hp: 200,
                name: '幽灵',
                atk: 20,
                type: 'legend',
                weight: 10
            },
        ];
    };

    async count() {
        const totalWeight = this._zombieDataType.reduce((sum, item) => sum + item.weight, 0);
        const safeMax = Math.floor(totalWeight);
        const random = crypto.randomInt(0, safeMax);
        let cumulativeWeight = 0;
        for (const item of this._zombieDataType) {
            cumulativeWeight += item.weight;
            if (random < cumulativeWeight) {
                return item;
            };
        };
        return null;
    };

};

class Player {
    protected _playerDataType: Array<playerDataType>;
    constructor() {
        this._playerDataType = [
            {
                id: '',
                name: '',
                hp: 100,
                brainCount: 0,
                ghostCount: 0,
                TreasureEqu: {
                    Potion: 0,
                    Coin: 0,
                    Fish: 0,
                    Trophy: 0,
                    Clip: 0,
                    Gun: 0,
                    Lantern: 0
                },
                online: false,
                dayAndNight: false
            }
        ];
    };
};

class TreasureItems {
    private readonly _treasureType: Array<treasureType>;
    constructor() {
        this._treasureType = [
            {
                id: 'TH-db2d963a-32ls-99z-3w2-3lok9sc522p',
                name: '人类狙击步枪',
                key: 'Gun',
                weight: .7
            },
            {
                id: 'TH-079ad73c-074e-4324-a510-e12bd475ee33',
                name: '酒瓶',
                key: 'Potion',
                weight: 80
            },
            {
                id: 'TH-0d268206-f493-4c2a-841f-5bdf69c579a6',
                name: '金币',
                key: 'Coin',
                weight: 9
            },
            {
                id: 'TH-c0967f96-b48c-470f-9720-b6e547f608d5',
                name: '鱼骨',
                key: 'Fish',
                weight: 100
            },
            {
                id: 'TH-cd08195a-b97b-481a-814e-4ea9b3aaa2f2',
                name: '圣杯',
                key: 'Trophy',
                weight: .2
            },
            {
                id: 'TH-eb7c854b-41xy-72a-4q9-5mjn2td831r',
                name: '弹夹-满发',
                key: 'Clip',
                weight: .1
            },
            {
                id: 'TH-iok987a-fv33-22d-12dc-oljfju89d0k',
                name: '提灯',
                key: 'Lantern',
                weight: 50
            },
        ];

    };

    async count() {

        const totalWeight = this._treasureType.reduce((sum, item) => sum + item.weight, 0);
        const safeMax = Math.floor(totalWeight);
        const random = crypto.randomInt(0, safeMax);
        let cumulativeWeight = 0;
        for (const item of this._treasureType) {
            cumulativeWeight += item.weight;
            if (random < cumulativeWeight) {
                return item;
            };
        };
        return null;

    };
};

class RandomWeight extends Marbles {
    private readonly _zombieType: Array<zombieType>;
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger
    constructor() {
        super();
        this._zombieType = [
            {
                name: '幽灵',
                type: 'waste',
                quantity: 3
            },
            {
                name: '幽灵',
                type: 'legend',
                quantity: 10
            }
        ];
    };

    async who(pn: string, type: string) {
        const data = this._zombieType.find(item => item.type === type);
        return await this.out(pn, data.quantity);
    };

    async out(pn: string, quantity: number) {
        const marblesItems = [];
        for (let i = 0; i < quantity; i++) {
            const item = await this.count();
            if (item) {
                marblesItems.push(item);
            };
        };
        this.logger.info({ uuid: pn, method: '@TemplateApiGame.service -> class.RandomWeight.out', data: marblesItems });

        return marblesItems;
    };

};

class Distribution extends Zombie {
    constructor() {
        super();
    };

    async where(radius: number, center: centerType) {
        let zombieItems: Array<zombieDataType> = [];
        let cordItems: Array<coordinateType> = [];
        const random = crypto.randomInt(3, 10);
        for (let i = 0; i < random; i++) {
            cordItems.push(await this.place(radius, center, this._zombieName));
            zombieItems.push(await this.count());
        };

        return {
            zombie: zombieItems,
            coordinate: cordItems
        };
    };

    async place(radius: number, center: centerType, name: string) {
        const angle = Math.random() * Math.PI * 2;
        /** Randomly generate a radius (0 to spawnRadius) */
        const randomRadius = Math.sqrt(Math.random()) * radius; // Use SQRT to ensure even distribution
        /** Convert polar coordinates to Cartesian coordinates */
        const x = center.x + randomRadius * Math.cos(angle);
        const z = center.z + randomRadius * Math.sin(angle);
        return {
            name: name,
            coordinate: { x, z }
        };
    };

};

class RandomTreasureItems extends TreasureItems {
    private readonly _treasureItemsRandomQuantity: Array<treasureItemsRandomQuantity>;
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger
    constructor() {
        super();
        this._treasureItemsRandomQuantity = [
            {
                type: 'waste',
                quantity: 3
            },
            {
                type: 'legend',
                quantity: 10
            }
        ];
    };

    async who(pn: string, type: string) {
        const data = this._treasureItemsRandomQuantity.find(item => item.type === type);
        return await this.out(pn, data.quantity);
    };

    async out(pn: string, quantity: number) {
        const treasureItems = [];
        for (let i = 0; i < quantity; i++) {
            const item = await this.count();
            if (item) {
                treasureItems.push(item);
            };
        };
        this.logger.info({ uuid: pn, method: '@TemplateApiGame.service -> class.RandomTreasureItems.out', data: treasureItems });

        return treasureItems;
    };
};


@Injectable()
export class TemplateApiGameMarblesService extends RandomWeight {
    constructor(
        private readonly redis: TemplateApiRedisService
    ) {
        super();
    };

    async fall(body: TemplateApiFall, id: string): Promise<Array<string>> {
        const json = await this.redis.get(`${id}_privateSceneGameMonstersGhostData`);
        if (json === null) return;
        const findItem = json.zombie.find((zombie: { uuid: string; }) => zombie.uuid === body.uuid);
        const data = await this.who(body.uuid, findItem.type);

        return data;
    };

};

@Injectable()
export class TemplateApiGameDistributionService extends Distribution {
    constructor() {
        super();
    };

    async randomDistributionOfCircularAreas(radius: number = 7, center: centerType = { x: 0, z: 0 }): Promise<any> {
        const data = await this.where(radius, center);

        return JSON.stringify(data);
    };

};

@Injectable()
export class TemplateApiGamePlayerService extends Player {
    private readonly filePath: string = join(process.cwd(), 'static/game', 'save.json');
    constructor(
        private readonly redis: TemplateApiRedisService
    ) {
        super();
    };
    async createPlayer(playerId: string, playerName: string): Promise<object> {
        this._playerDataType.map(item => {
            item.id = playerId,
                item.name = playerName
        });
        const beBornJSON = {
            "playerDataType": this._playerDataType[0],
            "coordinate": {
                "x": 5,
                "z": 5
            }
        };
        jsonfile.writeFileSync(this.filePath, beBornJSON);
        await this.redis.set(`${this._playerDataType[0].id}_playerHP`, this._playerDataType[0].hp);
        await this.redis.set(`${this._playerDataType[0].id}_playerBrainCount`, this._playerDataType[0].brainCount);
        await this.redis.set(`${this._playerDataType[0].id}_ghostCount`, this._playerDataType[0].ghostCount);
        await this.redis.set(`${this._playerDataType[0].id}_playerTreasureEqu`, this._playerDataType[0].TreasureEqu);
        await this.redis.set(`${this._playerDataType[0].id}_playerDataType`, this._playerDataType);

        /**
         * @description start new game for playerId.
         */
        publishSubscrib.publish('privateSceneGameMonstersGhostDataPlayerId', this._playerDataType[0].id);

        return {
            playerBrainCount: this._playerDataType[0].brainCount,
            ghostCount: this._playerDataType[0].ghostCount,
            playerTreasureEqu: this._playerDataType[0].TreasureEqu,
            playerId: this._playerDataType[0].id
        };
    };

};

@Injectable()
export class TemplateApiGameSaveFileService {
    private readonly filePath: string = join(process.cwd(), 'static/game', 'save.json');
    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
        private readonly redis: TemplateApiRedisService
    ) { };

    async readSave(body: TemplateApiGame): Promise<JSON | object> {
        try {

            /**@description player start new game on load game. */
            if (body.sw.type === 'read') {
                const json = await jsonfile.readFileSync(this.filePath);
                await this.redis.set(`${json.playerDataType.id}_playerDataType`, json);
                await this.redis.set(`${json.playerDataType.id}_playerHP`, json.playerDataType.hp);
                this.logger.info({ event: 'player is read game!', method: '@TemplateApiGameSaveFileService.service -> class.readSave', data: json });
                return {
                    code: HttpStatus.OK,
                    data: json
                };
            };

            /**@description player save game playerData. */
            if (body.sw.type === 'save') {
                if (body.sw.data) {
                    const json = await jsonfile.readFileSync(this.filePath);
                    const playerData = await this.redis.get(`${json.playerDataType.id}_playerDataType`);
                    const playerBrainCount = await this.redis.get(`${json.playerDataType.id}_playerBrainCount`);
                    const ghostCount = await this.redis.get(`${json.playerDataType.id}_ghostCount`);
                    const playerTreasureEqu = await this.redis.get(`${json.playerDataType.id}_playerTreasureEqu`);
                    const playerHP = await this.redis.get(`${json.playerDataType.id}_playerHP`);

                    if (playerData === null || playerBrainCount === null || playerHP === null || ghostCount === null || playerTreasureEqu === null) {
                        return {
                            code: HttpStatus.INTERNAL_SERVER_ERROR,
                            message: null
                        };
                    } else {
                        const saveData = {
                            "playerDataType": {
                                "id": playerData.playerDataType.id,
                                "name": playerData.playerDataType.name,
                                "hp": playerHP,
                                "brainCount": playerBrainCount,
                                "ghostCount": ghostCount,
                                "TreasureEqu": playerTreasureEqu
                            },
                            "coordinate": {
                                "x": body.sw.data.coordinate.x,
                                "z": body.sw.data.coordinate.z
                            }
                        };

                        const json = jsonfile.writeFileSync(this.filePath, saveData);
                        this.logger.info({ event: 'player is save game!', method: '@TemplateApiGameSaveFileService.service -> class.readSave', data: json });
                        return {
                            code: HttpStatus.OK,
                            message: '<<<+*+*+GameSaveDone+*+*+>>>'
                        };
                    };
                };
            };

        } catch (error) {
            throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
        };

    };

};

@Injectable()
export class TemplateApiGameSkillListService {
    constructor() { };

    async list(): Promise<JSON | object> {
        try {
            const filePath_Q = join(process.cwd(), 'static/game/images', 'arrow-scope.png');
            const filePath_empty = join(process.cwd(), 'static/game/images', 'resting-vampire.png');
            if (!fs.existsSync(filePath_Q) && !fs.existsSync(filePath_empty)) throw new NotFoundException('file not found');
            const base64StringQ = fs.readFileSync(filePath_Q, { encoding: 'base64' });
            const base64StringEmpty = fs.readFileSync(filePath_empty, { encoding: 'base64' });
            return {
                code: HttpStatus.OK,
                count: 5,
                skillImage: [{ url: 'data:image/png;base64,' + base64StringQ }, { url: 'data:image/png;base64,' + base64StringEmpty }, { url: 'data:image/png;base64,' + base64StringEmpty }, { url: 'data:image/png;base64,' + base64StringEmpty }, { url: 'data:image/png;base64,' + base64StringEmpty }],
                skillCdMask: [{
                    ref: 'cdMask1',
                    timer: ''
                }, {
                    ref: 'cdMask2',
                    timer: ''
                }, {
                    ref: 'cdMask3',
                    timer: ''
                }, {
                    ref: 'cdMask4',
                    timer: ''
                }, {
                    ref: 'cdMask5',
                    timer: ''
                }]
            };
        } catch (error) {
            throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
        };

    };

};

@Injectable()
export class TemplateApiScheduledTasksService {
    private readonly filePath: string = join(process.cwd(), 'static/game', 'save.json');
    constructor(
        private readonly redis: TemplateApiRedisService
    ) { };

    async task(data: string): Promise<JSON | object> {
        const json = await jsonfile.readFileSync(this.filePath);

        const status = await this.redis.set(`${json.playerDataType.id}_refreshGhostStatus`, data);

        return {
            code: HttpStatus.OK,
            msg: status,
        };
    };

    async listenTask(callback: any): Promise<void> {
        const json = await jsonfile.readFileSync(this.filePath);

        const status = await this.redis.get(`${json.playerDataType.id}_refreshGhostStatus`);
        callback(status);
    };

};

@Injectable()
export class TemplateApiGameTreasureService extends RandomTreasureItems {
    constructor(
        private readonly redis: TemplateApiRedisService
    ) {
        super();
    };
    async fall(body: TemplateApiTHFall, id: string): Promise<Array<string>> {
        const type = await this.redis.get(`${id}_privateSceneGameTreasureHuntDataType`);
        if (type === null) return;
        const data = await this.who(body.player_uuid, type.type);

        return data;

    };

};

@Injectable()
export class TemplateApiScheduledTreasureHuntTasksService {
    private readonly filePath: string = join(process.cwd(), 'static/game', 'save.json');
    constructor(
        private readonly redis: TemplateApiRedisService
    ) { };

    async task(data: string, id: string): Promise<JSON | object> {
        const status = await this.redis.set(`${id}_treasureHuntStatus`, data);
        const ghostCount = await this.redis.get(`${id}_ghostCount`);

        return {
            code: HttpStatus.OK,
            ghostCount: ghostCount,
            msg: status,
        };
    };

    async listenTask(callback: any): Promise<void> {
        const json = await jsonfile.readFileSync(this.filePath);

        const status = await this.redis.get(`${json.playerDataType.id}_treasureHuntStatus`);
        callback(status);
    };

};

/**
 * @description
 * 压力测试：针对大量装备数据缓存优化，优化内存管理，优化计算任务时长，快速响应，避免堆栈溢出
 */
@Injectable()
export class TemplateBackPack {
    potion: Map<string | number, object>;
    coin: Map<string | number, object>;
    fish: Map<string | number, object>;
    trophy: Map<string | number, object>;
    clip: Map<string | number, object>;
    gun: Map<string | number, object>;
    lantern: Map<string | number, object>;

    base64StringCoin: string;
    base64StringFish: string;
    base64StringTrophy: string;
    base64StringPotion: string;
    base64StringGun: string;
    base64StringClip: string;
    base64StringLantern: string;

    private readonly filePath: string = join(process.cwd(), 'static/game', 'save.json');

    private readonly filePath_coin: string  = join(process.cwd(), 'static/game/images', 'coin.png');
    private readonly filePath_fish: string  = join(process.cwd(), 'static/game/images', 'fish-bones.png');
    private readonly filePath_trophy: string  = join(process.cwd(), 'static/game/images', 'trophy.png');
    private readonly filePath_potion: string  = join(process.cwd(), 'static/game/images', 'wine-white.png');
    private readonly filePath_gun: string  = join(process.cwd(), 'static/game/images', 'blaster-e.png');
    private readonly filePath_clip: string  = join(process.cwd(), 'static/game/images', 'clip-large.png');
    private readonly filePath_Lantern: string  = join(process.cwd(), 'static/game/images', 'lantern-candle.png');
    constructor(
        private readonly redis: TemplateApiRedisService
    ) {
        this.potion = new Map();
        this.coin = new Map();
        this.fish = new Map();
        this.trophy = new Map();
        this.clip = new Map();
        this.gun = new Map();
        this.lantern = new Map();

        this.base64StringCoin = fs.readFileSync(this.filePath_coin, { encoding: 'base64' });
        this.base64StringFish = fs.readFileSync(this.filePath_fish, { encoding: 'base64' });
        this.base64StringTrophy = fs.readFileSync(this.filePath_trophy, { encoding: 'base64' });
        this.base64StringPotion = fs.readFileSync(this.filePath_potion, { encoding: 'base64' });
        this.base64StringGun = fs.readFileSync(this.filePath_gun, { encoding: 'base64' });
        this.base64StringClip = fs.readFileSync(this.filePath_clip, { encoding: 'base64' });
        this.base64StringLantern = fs.readFileSync(this.filePath_Lantern, { encoding: 'base64' });
    };

    async getItems() {
        try {

            jsonfile.readFileSync(this.filePath);
            const json = await jsonfile.readFileSync(this.filePath);
            const equ = json.playerDataType.TreasureEqu;

            /**@abstract Potion backpack items */
            for (let i = 0; i < equ.Potion; i++) {
                this.potion.set(i, {
                    name: '血瓶',
                    className: 'backPackItems',
                    classNameOth: false,
                    image: 'data:image/png;base64,' + this.base64StringPotion || null,
                    describe: {
                        title: {
                            txt: '酒',
                            col: '#ffffff'
                        },
                        type: {
                            txt: '普通消耗品 · 血瓶'
                        },
                        des: {
                            txt: '"海盗们出海必备，在普通不过了..."'
                        },
                        val: 5,
                        bor: '2px solid #ffffff',
                        showUse: true,
                        showSell: true,
                        showPut: false
                    }
                });
            };
            /**@abstract Coin backpack items */
            for (let i = 0; i < equ.Coin; i++) {
                this.coin.set(i, {
                    name: '金币',
                    className: 'backPackItems',
                    classNameOth: false,
                    image: 'data:image/png;base64,' + this.base64StringCoin || null,
                    describe: {
                        title: {
                            txt: '古金币',
                            col: '#f1c40f'
                        },
                        type: {
                            txt: '稀有货币 · 狗头金'
                        },
                        des: {
                            txt: '"这枚古金币看起来像是在哥布林手里抢来的，不知道为什么会在这里？"'
                        },
                        val: 50,
                        bor: '2px solid #f1c40f',
                        showUse: false,
                        showSell: true,
                        showPut: false
                    }
                });
            };
            /**@abstract Fish backpack items */
            for (let i = 0; i < equ.Fish; i++) {
                this.fish.set(i, {
                    name: '鱼骨',
                    className: 'backPackItems',
                    classNameOth: false,
                    image: 'data:image/png;base64,' + this.base64StringFish || null,
                    describe: {
                        title: {
                            txt: '鱼骨',
                            col: '#9d9d9d'
                        },
                        type: {
                            txt: '纯 · 垃圾'
                        },
                        des: {
                            txt: '"这味道...又腥又臭，刺激！"'
                        },
                        val: 2,
                        bor: '2px solid #9d9d9d',
                        showUse: false,
                        showSell: true,
                        showPut: false
                    }
                });
            };
            /**@abstract Trophy backpack items */
            for (let i = 0; i < equ.Trophy; i++) {
                this.trophy.set(i, {
                    name: '圣杯',
                    className: 'backPackItems-legend',
                    classNameOth: true,
                    image: 'data:image/png;base64,' + this.base64StringTrophy || null,
                    describe: {
                        title: {
                            txt: '圣杯',
                            col: '#ff6a00'
                        },
                        type: {
                            txt: '传说物品 · 祭品'
                        },
                        des: {
                            txt: '"据传说，海盗们为了得到它甚至不惜一切代价，难道传说中真的能召唤辽北第一狠船 · 彪哥 · 维多利亚幽灵号？"'
                        },
                        val: 500,
                        bor: '2px solid #ff6a00',
                        showUse: true,
                        showSell: true,
                        showPut: false
                    }
                });
            };
            /**@abstract Gun backpack items */
            for (let i = 0; i < equ.Gun; i++) {
                this.gun.set(i, {
                    name: '人类狙击步枪',
                    className: 'backPackItems-legend',
                    classNameOth: true,
                    image: 'data:image/png;base64,' + this.base64StringGun || null,
                    describe: {
                        title: {
                            txt: '人类狙击步枪',
                            col: '#ff6a00'
                        },
                        type: {
                            txt: '传说物品 · 热武器'
                        },
                        des: {
                            txt: '"这...好像是人类用的，但是少了个什么零件。传说使用此武器可以进入到另一个维度，能找到其他玩家？"'
                        },
                        val: 500,
                        bor: '2px solid #ff6a00',
                        showUse: true,
                        showSell: true,
                        showPut: false
                    }
                });
            };
            /**@abstract Clip backpack items */
            for (let i = 0; i < equ.Clip; i++) {
                this.clip.set(i, {
                    name: '弹夹-满发',
                    className: 'backPackItems-legend',
                    classNameOth: true,
                    image: 'data:image/png;base64,' + this.base64StringClip || null,
                    describe: {
                        title: {
                            txt: '弹夹-满发',
                            col: '#ff6a00'
                        },
                        type: {
                            txt: '传说物品 · 热武器'
                        },
                        des: {
                            txt: '"这...应该可以和什么东西组合在一块吧。传说和其他武器组合在一起使用就可以进入到另一个维度，能找到其他玩家？"'
                        },
                        val: 500,
                        bor: '2px solid #ff6a00',
                        showUse: false,
                        showSell: true,
                        showPut: true
                    }
                });
            };
            /**@abstract Clip backpack items */
            for (let i = 0; i < equ.Lantern; i++) {
                this.lantern.set(i, {
                    name: '提灯',
                    className: 'backPackItems',
                    classNameOth: false,
                    image: 'data:image/png;base64,' + this.base64StringLantern || null,
                    describe: {
                        title: {
                            txt: '提灯',
                            col: '#f1c40f'
                        },
                        type: {
                            txt: '稀有物品 · 消耗品'
                        },
                        des: {
                            txt: '"大白天也用不上啊..."'
                        },
                        val: 500,
                        bor: '2px solid #f1c40f',
                        showUse: true,
                        showSell: true,
                        showPut: false
                    }
                });
            };

            const itemsArray = [Array.from(this.potion.values()), Array.from(this.fish.values()), Array.from(this.trophy.values()), Array.from(this.coin.values()), Array.from(this.clip.values()), Array.from(this.gun.values()), Array.from(this.lantern.values())];

            return {
                code: HttpStatus.OK,
                msg: itemsArray,
            };

        } catch (error) {
            throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
        };
    };
};

@Injectable()
export class TemplateJoinMultiplayerOnline {
    private readonly filePath: string = join(process.cwd(), 'static/game', 'save.json');
    constructor(
        private readonly redis: TemplateApiRedisService
    ) { };

    async join(): Promise<JSON | object> {
        try {
            jsonfile.readFileSync(this.filePath);
            const json = await jsonfile.readFileSync(this.filePath);
            if (json === null) return;
            if (json.playerDataType.TreasureEqu.Gun >= 1 && json.playerDataType.TreasureEqu.Clip >= 1) {
                if (json.playerDataType.online) return;
                json.playerDataType.TreasureEqu.Gun -= 1;
                json.playerDataType.TreasureEqu.Clip -= 1;
                json.playerDataType.online = true;

                jsonfile.writeFileSync(this.filePath, json);

                return {
                    code: HttpStatus.OK
                };
            };

            return {
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                msg: 'where is Gun and Clip? '
            };
        } catch (error) {
            throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
        };
    };

};

@Injectable()
export class TemplatePlayerUseWear {
    private readonly filePath: string = join(process.cwd(), 'static/game', 'save.json');
    constructor(
        private readonly redis: TemplateApiRedisService
    ) { };

    async use(key: string): Promise<JSON | object> {
        try {
            jsonfile.readFileSync(this.filePath);
            const json = await jsonfile.readFileSync(this.filePath);
            if (json === null) return;
            if (json.playerDataType.TreasureEqu[key] >= 1) {
                if (json.playerDataType.online) return;
                json.playerDataType.TreasureEqu[key] -= 1;

                jsonfile.writeFileSync(this.filePath, json);

                return {
                    code: HttpStatus.OK
                };
            };

            return {
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                msg: 'where is Lantern? '
            };
        } catch (error) {
            throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
        };
    };

};

@Injectable()
export class TemplateCreatePlayerRole {
    private readonly filePath: string = join(process.cwd(), 'static/game', 'save.json');
    constructor() { };

    async role(body: TemplateApiGameCreatePlayerRole): Promise<JSON | object> {
        try {
            if (body.playerRoleName === null || body.playerRoleName === '') return {
                code: HttpStatus.INTERNAL_SERVER_ERROR
            };
            jsonfile.readFileSync(this.filePath);
            const json = await jsonfile.readFileSync(this.filePath);
            if (json === null) return {
                code: HttpStatus.INTERNAL_SERVER_ERROR
            };
            json.playerDataType.name = body.playerRoleName;
            jsonfile.writeFileSync(this.filePath, json);

            return {
                code: HttpStatus.OK,
                msg: json,
            };
        } catch (error) {
            throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
        };
    };

};

@Injectable()
export class TemplateSwitchGameMode {
    private readonly filePath: string = join(process.cwd(), 'static/game', 'save.json');
    constructor() { };

    async sw(body: { type: string, data: string }): Promise<JSON | object> {
        try {
            if (body.type === 'get') {
                jsonfile.readFileSync(this.filePath);
                const json = await jsonfile.readFileSync(this.filePath);
                return {
                    code: HttpStatus.OK,
                    msg: json.playerDataType.dayAndNight
                };
            };

            if (body.type === 'post') {
                jsonfile.readFileSync(this.filePath);
                const json = await jsonfile.readFileSync(this.filePath);
                if (json === null) return;
                json.playerDataType.dayAndNight = body.data;
                jsonfile.writeFileSync(this.filePath, json);
                return {
                    code: HttpStatus.OK,
                    msg: body.data
                };
            };
        } catch (error) {
            throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
        };
    };

};