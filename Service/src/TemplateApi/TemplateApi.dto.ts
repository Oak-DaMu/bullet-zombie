/**
 * @author Da Mu
 * @version v1.1.0.cn.sy.202508010128
 * @mail 317782199@qq.com
 */
import { IsString, IsNumber, IsNotEmpty, IsIn, IsObject, IsBoolean } from 'class-validator';


export class TemplateApiLoginJWTDto {

  @IsString()
  id: string;

};

export class TemplateApiFall {

  @IsString()
  uuid: string;

};

export class TemplateApiTHFall {

  @IsString()
  player_uuid: string;

  @IsString()
  type: string

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

export class TemplateApiGame {

  @IsObject()
  sw: {
    type: string,
    data?: {
      coordinate: {
        x: number,
        z: number
      }
    }
  };

};

export class TemplateApiGameAITrain {

  @IsNumber()
  iterations: number;

};

export class TemplateApiGameAIRun {

  @IsObject()
  ghost: {
    ghostHealth: number;
  }

};

export class TemplateApiGameOperateStatus {

  @IsBoolean()
  operate: boolean;

};

export class TemplateApiGameTHOperateStatus {

  @IsBoolean()
  operate: boolean;

  @IsNumber()
  ghostVal: number;

};

export class TemplateApiGameCreatePlayerRole {

  @IsString()
  playerRoleName: string;

};

export class TemplateApiGameModifyArchive {

  @IsNumber()
  brainCount: number;

  @IsNumber()
  ghostCount: number;

  @IsObject()
  TreasureEqu: {
    Potion: number;
    Gun: number;
    Clip: number;
    Coin: number;
    Fish: number;
    Trophy: number;
  };

};