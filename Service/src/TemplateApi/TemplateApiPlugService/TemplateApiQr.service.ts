/**
 * @author Da Mu
 * @version v1.1.0.cn.sy.202508010128
 * @mail 317782199@qq.com
 */
import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';


@Injectable()
export class TemplateApiQrService {
    constructor() { }

    async code(data: string) {
        return QRCode.toDataURL(data);
    };

};
