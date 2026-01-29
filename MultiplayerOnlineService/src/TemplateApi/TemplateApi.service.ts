/**
 * @author Da Mu
 * @version v1.1.0.cn.sy.202508010128
 * @mail 317782199@qq.com
 */
import { ConfigService } from '@nestjs/config';
import { Injectable, HttpStatus, HttpException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { TemplateApiLoginJWTDto, TemplateApiEmail } from './TemplateApi.dto';
import { TemplateApiDefaultService, TemplateApiLoginFallService } from './TemplateApi.entity';
import { TemplateApiRedisService } from './TemplateApiPlugService/TemplateApiRedis.service';
import { TemplateApiSvgCaptchaService } from './TemplateApiPlugService/TemplateApiSvgCode.service';
import { TemplateApiQrService } from './TemplateApiPlugService/TemplateApiQr.service';
import { TemplateApiMailService } from './TemplateApiPlugService/TemplateApiEmail.service';

interface fallItems {
  uuid: string,
  type: string
};

@Injectable()
export class TemplateApiService {
  newFallData: Array<object>
  newTHFallData: Array<object>
  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    private readonly redis: TemplateApiRedisService,
    private readonly svgcap: TemplateApiSvgCaptchaService,
    private readonly qr: TemplateApiQrService,
    private readonly mail: TemplateApiMailService
  ) {
    this.newFallData = [];
    this.newTHFallData = [];
  };

  async JWT(query: TemplateApiLoginJWTDto): Promise<TemplateApiDefaultService> {
    const data = this.jwt.sign({ userId: query.id }, {
      secret: this.config.get('template.secret'),
      expiresIn: this.config.get('template.expiresIn')
    });

    return {
      code: HttpStatus.OK,
      message: data
    };
    // throw new HttpException(data, HttpStatus.INTERNAL_SERVER_ERROR);
  };

  async svgcode(query: any): Promise<TemplateApiDefaultService> {
    const svgCaptcha = await this.svgcap.captche();
    this.redis.set('r_svg_code', svgCaptcha.text, 60 * 30);

    return {
      code: HttpStatus.OK,
      message: svgCaptcha.data
    };
  };

  async svgcodevalidate(code: string): Promise<TemplateApiDefaultService> {
    const r_svg_code = await this.redis.get('r_svg_code');

    if (code === r_svg_code) {
      return {
        code: HttpStatus.OK,
        message: 'svg图形验证-验证器通过'
      };
    } else {
      throw new HttpException('验证码错误', HttpStatus.INTERNAL_SERVER_ERROR);
    };
  };

  async qrcode(query: any): Promise<TemplateApiDefaultService> {
    const qr = await this.qr.code('https://gitee.com/mu1866');

    return {
      code: HttpStatus.OK,
      message: qr
    };
  };

  async email(query: TemplateApiEmail): Promise<TemplateApiDefaultService> {
    try {
      await this.mail.sendVerificationCode(query.email, query.code);

      return {
        code: HttpStatus.OK,
        message: 'email-发送成功'
      };
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    };
  };

};
