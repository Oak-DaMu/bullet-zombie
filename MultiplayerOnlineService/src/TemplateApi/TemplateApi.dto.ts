/**
 * @author Da Mu
 * @version v1.1.0.cn.sy.202508010128
 * @mail 317782199@qq.com
 */
import { IsString } from 'class-validator';


export class TemplateApiLoginJWTDto {

  @IsString()
  id: string;

};

export class TemplateApiDown {

  @IsString()
  fileName: string;

};

export class TemplateApiEmail {

  @IsString()
  email: string;

  @IsString()
  code: string;

};