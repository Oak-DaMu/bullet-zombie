/**
 * @author Da Mu
 * @version v1.1.0.cn.sy.202508010128
 * @mail 317782199@qq.com
 */
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Redis, type RedisKey } from 'ioredis';
import * as yaml from 'js-yaml';
import { readFileSync } from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), '/', 'config.yml');
const yamlLoad: any = yaml.load(readFileSync(filePath, 'utf-8'));


@Injectable()
export class TemplateApiRedisService {

  constructor(private readonly client: Redis) {
    this.client = new Redis({
      host: process.env.TEMPLATE_R_HOST || yamlLoad.rServer.host,
      port: process.env.TEMPLATE_R_PORT || yamlLoad.rServer.port,
      password: process.env.TEMPLATE_R_PORT || yamlLoad.rServer.secret,
      db: 0,
    });
  };

  async get(key: RedisKey) {
    try {
      const res = await this.client.get(key);
      return JSON.parse(res);
    } catch (e) {
      throw new HttpException(e, HttpStatus.BAD_REQUEST);
    };
  };

  async set(key: string, value: any, ttl = 10000) {
    try {
      return await this.client.set(key, JSON.stringify(value), 'EX', ttl);
    } catch (e) {
      throw new HttpException(e, HttpStatus.BAD_REQUEST);
    };
  };

  async delete(key: RedisKey[]) {
    try {
      return await this.client.del(key);
    } catch (e) {
      throw new HttpException(e, HttpStatus.BAD_REQUEST);
    };
  };

  async rpush(key: string, value: string) {
    try {
      return await this.client.rpush(key, value);
    } catch (e) {
      throw new HttpException(e, HttpStatus.BAD_REQUEST);
    };
  };

  async lrem(key: string, count: number, value: string) {
    return await this.client.lrem(key, count, value);
  };

};
