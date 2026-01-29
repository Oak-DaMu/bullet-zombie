/**
 * @author Da Mu
 * @version v1.1.0.cn.sy.202508010128
 * @mail 317782199@qq.com
 */
import { IsString, IsNumber, IsObject } from 'class-validator';


export class TemplateApiDefaultService {
  /**
   * 状态码
   */
  @IsNumber()
  code: number;

  /**
   * 消息
   */
  @IsString()
  message?: string;

};

export class TemplateApiLoginFallService {
  /**
   * 状态码
   */
  @IsNumber()
  code: number;

  /**
   * 消息
   */
  @IsString()
  message?: Array<string>;

};
