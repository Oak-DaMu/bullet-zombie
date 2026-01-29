/**
 * @author Da Mu
 * @version v1.1.0.cn.sy.202508010128
 * @mail 317782199@qq.com
 */
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Redis, type RedisKey } from 'ioredis';


@Injectable()
export class TemplateApiRedisService {
  constructor(private readonly redis: Redis) { }

  async get(key: RedisKey) {
    try {
      const res = await this.redis.get(key);
      return JSON.parse(res);
    } catch (e) {
      throw new HttpException(e, HttpStatus.BAD_REQUEST);
    };
  };

  async set(key: string, value: any, ttl = 10000) {
    try {
      return await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
    } catch (e) {
      throw new HttpException(e, HttpStatus.BAD_REQUEST);
    };
  };

  async delete(key: RedisKey[]) {
    try {
      return await this.redis.del(key);
    } catch (e) {
      throw new HttpException(e, HttpStatus.BAD_REQUEST);
    };
  };

  async incr(key: RedisKey) {
    try {
      return await this.redis.incr(key);
    } catch (e) {
      throw new HttpException(e, HttpStatus.BAD_REQUEST);
    };
  };

  async decr(key: RedisKey) {
    try {
      return await this.redis.decr(key);
    } catch (e) {
      throw new HttpException(e, HttpStatus.BAD_REQUEST);
    };
  };

  async expire(key: RedisKey, number: number | string) {
    try {
      return await this.redis.expire(key, number);
    } catch (e) {
      throw new HttpException(e, HttpStatus.BAD_REQUEST);
    };
  };

  async rpush(key: string, value: string) {
    try {
      return await this.redis.rpush(key, value);
    } catch (e) {
      throw new HttpException(e, HttpStatus.BAD_REQUEST);
    };
  };

  async getAllElements(key: string): Promise<string[]> {
    return await this.redis.lrange(key, 0, -1);
  };

  async lrem(key: string, count: number, value: string) {
    return await this.redis.lrem(key, count, value);
  };


};
