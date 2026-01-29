/**
 * @author Da Mu
 * @version v1.1.0.cn.sy.202508010128
 * @mail 317782199@qq.com
 */
import { Controller, Post, Get, Res, Body, Query, UseInterceptors, UseGuards, HttpCode, HttpStatus, UploadedFile, UploadedFiles, BadRequestException, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { TemplateApiRedisService } from './TemplateApiPlugService/TemplateApiRedis.service';
import { TemplateApiLoginJWTDto, TemplateApiGameCreatePlayerRole, TemplateApiFall, TemplateApiTHFall, TemplateApiDown, TemplateApiEmail, TemplateApiGame, TemplateApiGameAITrain, TemplateApiGameAIRun, TemplateApiGameOperateStatus, TemplateApiGameTHOperateStatus, TemplateApiGameModifyArchive } from './TemplateApi.dto';
import { TemplateJoinMultiplayerOnline, TemplatePlayerUseWear, TemplateSwitchGameMode, TemplateCreatePlayerRole, TemplateApiGameSaveFileService, TemplateApiGameSkillListService, TemplateApiScheduledTasksService, TemplateApiScheduledTreasureHuntTasksService, TemplateBackPack } from './TemplateApiGameService/TemplateApiGame.service';
import { TemplateApiAIService } from './TemplateApiAIService/TemplateApiAI.service';
import { TemplateApiService } from './TemplateApi.service';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import UploadsType from '../utils/uploads.type';
import * as jsonfile from 'jsonfile';
import * as path from 'path';
import { existsSync, writeFileSync, readFileSync } from 'fs';

function getGhostDecisionMakingMaxValue(obj: { [s: string]: unknown; } | ArrayLike<unknown>, num: number) {
    return Object.entries(obj).reduce((a, b) => a[1] > b[1] ? a : b)[num];
};

@ApiTags('TemplateApi')
@Controller({
    path: 'temp_api',
    version: '1',
})
export class TemplateApiController {
    constructor(
        private readonly redis: TemplateApiRedisService,
        private readonly templateApiService: TemplateApiService,
        private readonly gameSaveFileService: TemplateApiGameSaveFileService,
        private readonly gameSkillListService: TemplateApiGameSkillListService,
        private readonly gameAIService: TemplateApiAIService,
        private readonly gameScheduledTasksService: TemplateApiScheduledTasksService,
        private readonly gameTemplateBackPackService: TemplateBackPack,
        private readonly gameTemplateJoinMO: TemplateJoinMultiplayerOnline,
        private readonly gameTemplatePlayerUseWear: TemplatePlayerUseWear,
        private readonly gameTemplateSwitchGameMode: TemplateSwitchGameMode,
        private readonly gameTemplateCreatePlayerRole: TemplateCreatePlayerRole,
        private readonly gameScheduledTreasureHuntTasksService: TemplateApiScheduledTreasureHuntTasksService
    ) {

    };

    @Get('jwt')
    @ApiOperation({
        summary: '模板-JWT-生成器',
        description:
            '模板-用来测试 JWT 生成器',
    })
    async JWT(@Body() body: any, @Res() res: any, @Query() query: TemplateApiLoginJWTDto): Promise<any> {
        const token = await this.templateApiService.JWT(query);

        res.send(token);
    };

    @UseGuards(AuthGuard('jwt'))
    @Post('jwt_validate')
    @ApiOperation({
        summary: '模板-JWT-验证器',
        description:
            '模板-用来测试 JWT 验证器',
    })
    async JWTValidate(@Body() body: any, @Query() query: TemplateApiLoginJWTDto, @Res() res: any): Promise<any> {
        res.send({
            code: HttpStatus.OK,
            message: 'token-测试验证通过'
        });
    };

    @Post('upload')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: 'static/uploads/files',
            filename: (req, file, callback) => {
                return callback(null, `${uuidv4()}${path.extname(file.originalname)}`);
            }
        }),
        fileFilter(req, file, callback) {
            // 文档类型上传
            UploadsType.File(file, (num: number) => {
                if (num) {
                    callback(null, true);
                } else {
                    callback(
                        new BadRequestException('只允许上传文档文件（PDF, DOC, DOCX, XLS, XLSX, TXT）'),
                        false,
                    );
                };
            });
        },
        limits: {
            fileSize: UploadsType.imageFileSize
        }
    }))
    @ApiOperation({
        summary: '模板-文件上传',
        description:
            '模板-用来测试文件上传',
    })
    async upload(@UploadedFile() file: Express.Multer.File, @Body() body: any, @Res() res: any): Promise<any> {
        console.log('file:', file);

        res.send({
            code: HttpStatus.OK,
            message: '文件上传成功'
        });
    };

    @Post('uploads')
    @UseInterceptors(FilesInterceptor('files', 3, {
        storage: diskStorage({
            destination: 'static/uploads/images',
            filename: (req, file, callback) => {
                return callback(null, `${uuidv4()}${path.extname(file.originalname)}`);
            }
        }),
        fileFilter(req, file, callback) {
            // 图片类型上传
            UploadsType.Image(file, (num: number) => {
                if (num) {
                    callback(null, true);
                } else {
                    return callback(
                        new BadRequestException('只允许上传图片文件（jpg, jpeg, png, gif）'),
                        false,
                    );
                };
            });
        },
        limits: {
            fileSize: UploadsType.fileFileSize
        }
    }))
    @ApiOperation({
        summary: '模板-多文件上传',
        description:
            '模板-用来测试多文件上传',
    })
    async uploads(@UploadedFiles() files: Array<Express.Multer.File>, @Body() body: any, @Res() res: any): Promise<any> {
        console.log('files:', files);

        res.send({
            code: HttpStatus.OK,
            message: '文件上传成功'
        });
    };

    @Get('download')
    // @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '模板-文件下载',
        description:
            '模板-用来测试文件下载',
    })
    async download(@Query() query: TemplateApiDown, @Res() res: any): Promise<any> {
        const filePath = path.join(process.cwd(), 'static/uploads/images', 'fdd56209-05b7-454f-b955-893c9b7064f6.jpg');
        if (!existsSync(filePath)) {
            throw new NotFoundException('file not found');
        };
        // res.download(filePath);
        res.sendFile(filePath);
    };

    @Get('svgcode')
    // @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '模板-svg图形验证码',
        description:
            '模板-用来测试 svg 图形验证码',
    })
    async svgcode(@Query() query: any, @Res() res: any): Promise<any> {
        const svgcode = await this.templateApiService.svgcode(query);

        // res.type('image/svg+xml');
        res.send(svgcode);
    };

    @Post('svgcode_validate')
    // @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '模板-svg图形验证码-验证器',
        description:
            '模板-用来测试 svg 图形验证码-验证器',
    })
    async svgcodevalidate(@Query() query: any, @Res() res: any): Promise<any> {
        const { code } = query;
        const svgcode = await this.templateApiService.svgcodevalidate(code);

        res.send(svgcode);
    };

    @Get('qr')
    // @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '模板-二维码',
        description:
            '模板-用来测试二维码',
    })
    async qr(@Query() query: any, @Res() res: any): Promise<any> {
        const qr = await this.templateApiService.qrcode(query);

        res.send(qr);
    };

    @Post('email')
    // @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '模板-svg图形验证码-验证器',
        description:
            '模板-用来测试 svg 图形验证码-验证器',
    })
    async mail(@Query() query: TemplateApiEmail, @Res() res: any): Promise<any> {
        const svgcode = await this.templateApiService.email(query);

        res.send(svgcode);
    };

    /** ---------------------------------------------- Game ---------------------------------------------------- */

    @Post('game/fall')
    // @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '模板-权重概率掉落',
        description:
            '模板-用来测试权重概率掉落',
    })
    async fall(@Body() body: TemplateApiFall, @Res() res: any): Promise<any> {
        const equipment = await this.templateApiService.fall(body);

        res.send(equipment);
    };

    @Post('game/THFall')
    // @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '模板-宝藏权重概率掉落',
        description:
            '模板-用来测试宝藏权重概率掉落',
    })
    async THFall(@Body() body: TemplateApiTHFall, @Res() res: any): Promise<any> {
        const equipment = await this.templateApiService.THFall(body);

        res.send(equipment);
    };

    @Post('game/save')
    // @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '模板-存档',
        description:
            '模板-用来测试存档',
    })
    async save(@Body() body: TemplateApiGame, @Res() res: any): Promise<any> {
        const jsonfile = await this.gameSaveFileService.readSave(body);

        res.send(jsonfile);
    };

    @Get('game/skillList')
    // @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '模板-技能列表',
        description:
            '模板-用来测试技能列表',
    })
    async skillList(@Body() body: any, @Res() res: any): Promise<any> {
        const jsonfile = await this.gameSkillListService.list();

        res.send(jsonfile);
    };

    @Post('game/ai-train')
    // @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '模板-AI训练',
        description:
            '模板-用来测试AI训练【Ghost行为决策】',
    })
    async aiTrain(@Body() body: TemplateApiGameAITrain, @Res() res: any): Promise<any> {
        res.setTimeout(1800000);

        const safeSubtract = (a: number, b: number) => Math.max(0, a - b);

        try {
            const filePath_pid = path.join(process.cwd(), 'static/game', 'save.json');
            const json_pid = await jsonfile.readFileSync(filePath_pid, 'utf8');
            const playerId = json_pid.playerDataType.id;

            const pbc = await this.redis.get(`${playerId}_playerBrainCount`);

            if (pbc <= 0 || body.iterations === 0) {
                res.send({
                    code: HttpStatus.INTERNAL_SERVER_ERROR,
                    playerBrainCount: pbc,
                    message: '???Where is the brain?'
                });
                return;
            };

            if (body.iterations > pbc) {
                try {
                    json_pid.playerDataType.brainCount = 0;
                    jsonfile.writeFileSync(filePath_pid, json_pid);
                    await this.redis.set(`${playerId}_playerBrainCount`, 0);
                    body.iterations = pbc;
                } catch (error) {
                    res.send({
                        code: HttpStatus.INTERNAL_SERVER_ERROR,
                        message: error
                    });
                };
            } else {
                try {
                    const new_pbc = safeSubtract(pbc, body.iterations);
                    json_pid.playerDataType.brainCount = new_pbc;
                    jsonfile.writeFileSync(filePath_pid, json_pid);
                    await this.redis.set(`${playerId}_playerBrainCount`, new_pbc);
                } catch (error) {
                    res.send({
                        code: HttpStatus.INTERNAL_SERVER_ERROR,
                        message: error
                    });
                };
            };

            /**
             * @constant decisionData default Ghost behavior decision-making
             */
            const filePath_dec = path.join(process.cwd(), 'static/AI', 'GhostBehavioralDecisionMakingData.json');
            const json_dec = await jsonfile.readFileSync(filePath_dec);
            const decisionData = json_dec.decisionData;

            /** AI train */
            let logPeriod = '';
            const module = this.gameAIService.train(decisionData, {
                iterations: body.iterations,
                log: ((details: any) => {
                    console.log(`iterations: ${details.iterations}, output: ${details.error}`);
                    logPeriod = details.error;
                }) as unknown as boolean, // Force type conversion
                logPeriod: 1
            });

            /** AI save */
            const json = this.gameAIService.toJSON();
            const filePath = path.join(process.cwd(), 'static/AI', 'GhostTrainData.json');
            const dataString = JSON.stringify(json, null, 2);
            writeFileSync(filePath, dataString);

            await this.redis.set(`${playerId}_AI-Error`, logPeriod);
            const new_pbc = await this.redis.get(`${playerId}_playerBrainCount`);

            res.send({
                code: HttpStatus.OK,
                brainCount: new_pbc,
                module: module
            });

        } catch (error) {
            res.send({
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error
            });
        };

    };

    @Post('game/ai-run')
    // @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '模板-执行AI训练模型',
        description:
            '模板-用来测试执行AI训练模型',
    })
    async aiRun(@Body() body: TemplateApiGameAIRun, @Res() res: any): Promise<any> {
        try {
            const filePath_pid = path.join(process.cwd(), 'static/game', 'save.json');
            const json_pid = await jsonfile.readFileSync(filePath_pid, 'utf8');
            const playerId = json_pid.playerDataType.id;

            const AIError = await this.redis.get(`${playerId}_AI-Error`);
            if (AIError > 0.005 || AIError === null) {
                res.send({
                    code: HttpStatus.INTERNAL_SERVER_ERROR,
                    model: {
                        key: 1,
                        value: "lowBehaviorMode"
                    }
                })
                return;
            };

            /** AI load */
            const filePath = path.join(process.cwd(), 'static/AI', 'GhostTrainData.json');
            const dataBuffer = readFileSync(filePath, 'utf8');
            const data = JSON.parse(dataBuffer);
            await this.gameAIService.fromJSON(data);

            /** AI run */
            const module = this.gameAIService.run(body.ghost);

            /** AI Final decision */
            const filePath_fd = path.join(process.cwd(), 'static/AI', 'GhostFinalDecision.json');
            const dataBuffer_fd = readFileSync(filePath_fd, 'utf8');
            const data_fd = JSON.parse(dataBuffer_fd);
            const key = getGhostDecisionMakingMaxValue(module, 0).toString();

            res.send({
                code: HttpStatus.OK,
                module: {
                    key: getGhostDecisionMakingMaxValue(module, 0),
                    value: getGhostDecisionMakingMaxValue(module, 1),
                    fd: data_fd[key]
                }
            });
        } catch (error) {
            res.send({
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'The model structure is incomplete. Please check the AI training process!'
            });
        };
    };

    @Post('game/ai-save')
    // @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '模板-保存AI训练模型',
        description:
            '模板-用来测试保存AI训练模型',
    })
    async aiSave(@Body() body: any, @Res() res: any): Promise<any> {
        try {
            const module = this.gameAIService.toJSON();
            const filePath = path.join(process.cwd(), 'static/AI', 'GhostTrainData.json');
            const dataString = JSON.stringify(module, null, 2);
            writeFileSync(filePath, dataString);
            res.send({
                code: HttpStatus.OK,
                message: 'save GhostTrainDataJSON!'
            });
        } catch (error) {
            res.send({
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error
            });
        };

    };

    @Post('game/ai-load')
    // @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '模板-加载AI训练模型',
        description:
            '模板-用来测试加载AI训练模型',
    })
    async aiLoad(@Body() body: any, @Res() res: any): Promise<any> {
        try {
            const filePath = path.join(process.cwd(), 'static/AI', 'GhostTrainData.json');
            const dataBuffer = readFileSync(filePath, 'utf8');
            const data = JSON.parse(dataBuffer);
            this.gameAIService.fromJSON(data);
            res.send({
                code: HttpStatus.OK,
                message: 'load GhostTrainDataJSON!'
            });
        } catch (error) {
            res.send({
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'The model structure is incomplete. Please check the AI training process!'
            });
        };

    };

    @Post('game/scheduledTasks')
    // @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '模板-开启关闭定时任务',
        description:
            '模板-用来测试开启关闭定时任务',
    })
    async scheduledTasks(@Body() body: TemplateApiGameOperateStatus, @Res() res: any): Promise<any> {
        try {
            const sw = body.operate ? 'start' : 'stop';
            const json = await this.gameScheduledTasksService.task(sw);
            res.send(json);
        } catch (error) {
            res.send({
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error
            });
        };

    };

    @Post('game/scheduledTreasureHuntTasks')
    // @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '模板-开启关闭寻宝定时任务',
        description:
            '模板-用来测试开启关闭寻宝定时任务',
    })
    async scheduledTreasureHuntTasks(@Body() body: TemplateApiGameTHOperateStatus, @Res() res: any): Promise<any> {
        try {
            const filePath_pid = path.join(process.cwd(), 'static/game', 'save.json');
            const json_pid = await jsonfile.readFileSync(filePath_pid, 'utf8');
            const playerId = json_pid.playerDataType.id;

            if (body.operate) {
                const safeSubtract = (a: number, b: number) => Math.max(0, a - b);

                const gc = await this.redis.get(`${playerId}_ghostCount`);

                if (gc <= 0 || gc < 100 || body.ghostVal < 100 || body.ghostVal > 100) {
                    res.send({
                        code: HttpStatus.INTERNAL_SERVER_ERROR,
                        ghostCount: gc,
                        message: '???Where is the ghost? sufficient? Too much?'
                    });
                    return;
                };

                if (body.ghostVal > gc) {
                    try {
                        json_pid.playerDataType.ghostCount = 0;
                        jsonfile.writeFileSync(filePath_pid, json_pid);
                        await this.redis.set(`${playerId}_ghostCount`, 0);
                    } catch (error) {
                        res.send({
                            code: HttpStatus.INTERNAL_SERVER_ERROR,
                            message: error
                        });
                    };
                } else {
                    try {
                        const new_gc = safeSubtract(gc, body.ghostVal);
                        json_pid.playerDataType.ghostCount = new_gc;
                        jsonfile.writeFileSync(filePath_pid, json_pid);
                        await this.redis.set(`${playerId}_ghostCount`, new_gc);
                    } catch (error) {
                        res.send({
                            code: HttpStatus.INTERNAL_SERVER_ERROR,
                            message: error
                        });
                    };
                };

                const sw = body.operate ? 'start' : 'stop';
                const json = await this.gameScheduledTreasureHuntTasksService.task(sw, playerId);
                res.send(json);
            } else {
                const sw = body.operate ? 'start' : 'stop';
                const json = await this.gameScheduledTreasureHuntTasksService.task(sw, playerId);
                res.send(json);
            };

        } catch (error) {
            res.send({
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error
            });
        };

    };

    @Get('game/backpack')
    // @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '模板-获取背包物品',
        description:
            '模板-用来测试获取背包物品',
    })
    async backpack(@Body() body: any, @Res() res: any): Promise<any> {
        try {
            const json = await this.gameTemplateBackPackService.getItems();
            res.send(json);
        } catch (error) {
            res.send({
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error
            });
        };

    };

    @Post('game/joinMO')
    // @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '模板-加入多人在线',
        description:
            '模板-用来测试加入多人在线',
    })
    async joinMO(@Body() body: any, @Res() res: any): Promise<any> {
        try {
            const json = await this.gameTemplateJoinMO.join();
            res.send(json);
        } catch (error) {
            res.send({
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error
            });
        };

    };

    @Post('game/playerUseWear')
    // @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '模板-玩家使用穿戴装备',
        description:
            '模板-用来测试玩家使用穿戴装备',
    })
    async playerWear(@Body() body: { type: string }, @Res() res: any): Promise<any> {
        try {
            const json = await this.gameTemplatePlayerUseWear.use(body.type);
            res.send(json);
        } catch (error) {
            res.send({
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error
            });
        };

    };

    @Post('game/createPlayerRole')
    // @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '模板-创建玩家游戏角色',
        description:
            '模板-用来测试创建玩家游戏角色',
    })
    async createPlayerRole(@Body() body: TemplateApiGameCreatePlayerRole, @Res() res: any): Promise<any> {
        try {
            const json = await this.gameTemplateCreatePlayerRole.role(body);
            res.send(json);
        } catch (error) {
            res.send({
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error
            });
        };

    };

    @Post('game/switchGameMode')
    // @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '模板-切换游戏模式',
        description:
            '模板-用来测试切换游戏模式',
    })
    async switchGameMode(@Body() body: { type: string, data: string }, @Res() res: any): Promise<any> {
        try {
            const json = await this.gameTemplateSwitchGameMode.sw(body);
            res.send(json);
        } catch (error) {
            res.send({
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error
            });
        };

    };

    /**@description 累了 不爱写了 做个演示吧... */
    @Get('game/enchant')
    // @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '模板-附魔',
        description:
            '模板-用来测试附魔',
    })
    async enchant(@Body() body: any, @Res() res: any): Promise<any> {
        try {
            res.send({
                code: 200,
                msg: true
            });
        } catch (error) {
            res.send({
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error
            });
        };
    };

    @Get('game/cleanUpJunkRedisdata')
    // @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '模板-清理Redis垃圾数据',
        description:
            '模板-用来测试清理Redis垃圾数据',
    })
    async cleanUpJunkRedisdata(@Body() body: any, @Res() res: any): Promise<any> {
        try {
            const filePath = path.join(process.cwd(), 'static/game', 'save.json');
            const json = await jsonfile.readFileSync(filePath, 'utf8');
            const playerId = json.playerDataType.id;

            const del = await this.redis.delete([`${playerId}_playerHP`, `${playerId}_playerDataType`]);
            res.send({
                code: 200,
                message: del
            });
        } catch (error) {
            res.send({
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error
            });
        };
    };

    @Get('game/getPlayerName')
    // @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '模板-获取玩家名称',
        description:
            '模板-用来测试获取玩家名称',
    })
    async getPlayerName(@Body() body: any, @Res() res: any): Promise<any> {
        try {
            const filePath = path.join(process.cwd(), 'static/game', 'save.json');
            const json = await jsonfile.readFileSync(filePath, 'utf8');
            const playerName = json.playerDataType.name;

            res.send({
                code: 200,
                message: playerName
            });
        } catch (error) {
            res.send({
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error
            });
        };
    };

    @Post('game/playerModifyArchive')
    // @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '模板-修改玩家存档',
        description:
            '模板-用来测试修改玩家存档',
    })
    async playerModifyArchive(@Body() body: TemplateApiGameModifyArchive, @Res() res: any): Promise<any> {
        try {
            const filePath = path.join(process.cwd(), 'static/game', 'save.json');
            const json = await jsonfile.readFileSync(filePath, 'utf8');

            json.playerDataType.brainCount = body.brainCount;
            json.playerDataType.ghostCount = body.ghostCount;
            json.playerDataType.TreasureEqu = body.TreasureEqu;

            jsonfile.writeFileSync(filePath, json);

            res.send({
                code: 200,
                message: json
            });
        } catch (error) {
            res.send({
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error
            });
        };
    };

};