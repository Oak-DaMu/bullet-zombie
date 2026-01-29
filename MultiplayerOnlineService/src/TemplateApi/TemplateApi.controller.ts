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
import { TemplateApiLoginJWTDto, TemplateApiDown, TemplateApiEmail } from './TemplateApi.dto';
import { TemplateApiService } from './TemplateApi.service';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import UploadsType from '../utils/uploads.type';
import * as jsonfile from 'jsonfile';
import * as path from 'path';
import { existsSync, writeFileSync, readFileSync } from 'fs';


@ApiTags('TemplateApi')
@Controller({
    path: 'temp_api',
    version: '1',
})
export class TemplateApiController {
    constructor(
        private readonly redis: TemplateApiRedisService,
        private readonly templateApiService: TemplateApiService
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
    
};