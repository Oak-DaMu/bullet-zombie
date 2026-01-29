/**
 * @author Da Mu
 * @version v1.1.0.cn.sy.202508010128
 * @mail 317782199@qq.com
 */
import { Injectable } from '@nestjs/common';
import * as brain from 'brain.js';

interface options {
    iterations: number,
    log: boolean,
    logPeriod: number,
    // learningRate: number
};

@Injectable()
export class TemplateApiAIService {
    private neuralNetworkGPU: brain.NeuralNetworkGPU<Record<string, number>, Record<string, number>>;

    constructor() {
        this.neuralNetworkGPU = new brain.NeuralNetworkGPU();
    };

    /**
     * 
     * @param trainingData 
     * @param options 
     * @returns train model
     */
    train(trainingData: Array<{ input: any; output: any }>, options?: options) {
        return this.neuralNetworkGPU.train(trainingData, options);
    };

    /**
     * 
     * @param input 
     * @returns calculate model
     */
    run(input: any): any {
        return this.neuralNetworkGPU.run(input);
    };

    /**
     * 
     * @returns save model
     */
    toJSON(): any {
        return this.neuralNetworkGPU.toJSON();
    };

    /**
     * 
     * @param json load model
     */
    async fromJSON(json: any) {
        this.neuralNetworkGPU.fromJSON(json);
    };

};