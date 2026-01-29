/**
 * @author Da Mu
 * @version v1.1.0.cn.sy.202508010128
 * @mail 317782199@qq.com
 */
import { Injectable } from '@nestjs/common';
import * as svgCaptcha from "svg-captcha";


@Injectable()
export class TemplateApiSvgCaptchaService {
    constructor() { }

    async captche(size: number = 4) {
        const captcha = svgCaptcha.create({
            //可配置返回的图片信息
            size, //生成几个验证码
            fontSize: 50, //文字大小
            width: 100, //宽度
            height: 34, //高度
            background: "#cc9966", //背景颜色
        });
        return captcha;
    };



};
