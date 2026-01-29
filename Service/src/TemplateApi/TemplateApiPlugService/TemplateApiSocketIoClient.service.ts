/**
 * @author Da Mu
 * @version v1.1.0.cn.sy.202508010128
 * @mail 317782199@qq.com
 */
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';
import * as yaml from 'js-yaml';
import { readFileSync } from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), '/', 'config.yml');
const yamlLoad: any = yaml.load(readFileSync(filePath, 'utf-8'));

@Injectable()
export class TemplateApiSocketIoClient implements OnModuleInit, OnModuleDestroy {
    public socketClient: Socket;
    
    constructor() {
        this.socketClient = io(process.env.TEMPLATE_DOMAIN || yamlLoad.socketIOClient.host, {
            path: process.env.TEMPLATE_PATH || yamlLoad.socketIOClient.path,
            transports: ['websocket'],
            autoConnect: false,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });
    };

    onModuleInit() {
        this.connect();
    };

    onModuleDestroy() {
        this.disconnect();
    };

    connect() {
        this.socketClient.connect();
    };

    disconnect() {
        this.socketClient.disconnect();
    };

    emit(event: string, data: any) {
        this.socketClient.emit(event, data);
    };

    on(event: string, callback: (data: any) => void) {
        this.socketClient.on(event, callback);
    };
};