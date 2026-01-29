/**
 * @author Da Mu
 * @version v1.1.0.cn.sy.202508010128
 * @mail 317782199@qq.com
 */
import { HtmlSubscription } from '@/utils/HtmlSubscription';
import proxy from '@/config/host';

export default class Game2D extends Phaser.Scene {
    constructor() {
        super({
            key: 'Game2D'
        });

        this.http = `${proxy.development.API}`;
        this.path_img_2d = `${proxy.development.PATH_IMG_2D}`;

        this.all_exa = [];
        this.obs_key = [{
            key: 'rp-left',
            x: 50,
            y: 168
        }, {
            key: 'rp-middle',
            x: 130,
            y: 168
        }, {
            key: 'rp-right',
            x: 210,
            y: 168
        }, {
            key: 'cloud',
            x: 220,
            y: 40
        }, {
            key: 'cloud',
            x: 40,
            y: 40
        }];

        this.ball = null;
        this.obstacle = null;

    };

    preload() {
        this.load.setBaseURL(this.http);

        this.load.image('rp-left', this.path_img_2d + 'skull.png');
        this.load.image('rp-middle', this.path_img_2d + 'castleWide.png');
        this.load.image('rp-right', this.path_img_2d + 'churchLarge.png');

        this.load.image('cloud', this.path_img_2d + 'textureWater.png');

        this.load.image('obstacle', this.path_img_2d + 'textureBricks.png');

        this.load.image('ball', this.path_img_2d + 'elementCircle.png');
    };

    create() {

        this.obs_key.map(obj => {
            this.all_exa.push(
                this.physics.add.image(obj.x, obj.y, obj.key)
                    .setScale(.4, .4)
                    .setGravity(false)
                    .setImmovable(true)
            );
        });

        this.obstacle = this.physics.add.image(10, 120, 'obstacle')
            .setScale(.3, .3)
            .setGravity(false)
            .setImmovable(true)

        this.all_exa.push(this.obstacle);

        this.tweens.add({
            targets: this.obstacle,
            x: 240,
            duration: 2000,
            ease: 'Linear',
            yoyo: true,
            repeat: -1
        });

        this.input.on('pointerdown', (pointer) => {
            HtmlSubscription.publish('game_2d_scene_get_ball');
        });

        HtmlSubscription.subscribe('game_2d_scene_res_ball', () => {
            const { x, y } = this.getRandomNumbers();
            this.ball = this.physics.add.image(130, 10, 'ball')
                .setScale(.3, .3)
                .setVelocity(x, y)
                .setBounce(.5, .5)
                .setAccelerationY(200)
                .setCollideWorldBounds(true);

            this.physics.add.collider(this.ball, this.all_exa, (e, v) => {
                if (v.texture.key === 'rp-left') {
                    e.destroy(true);
                    HtmlSubscription.publish('game_2d_scene_count_ball', 'rp-left');
                };
                if (v.texture.key === 'rp-middle') {
                    e.destroy(true);
                    HtmlSubscription.publish('game_2d_scene_count_ball', 'rp-middle');
                };
                if (v.texture.key === 'rp-right') {
                    e.destroy(true);
                    HtmlSubscription.publish('game_2d_scene_count_ball', 'rp-right');
                };
            });
        });

    };

    getRandomNumbers() {
        const x = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 150 + 50);
        const y = Math.random() * 150 + 50;
        return { x, y };
    };
};