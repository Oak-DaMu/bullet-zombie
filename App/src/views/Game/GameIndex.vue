<script setup>
/**
 * @author Da Mu
 * @version v1.1.0.cn.sy.202508010128
 * @mail 317782199@qq.com
 */
import { ref, reactive, onMounted, nextTick } from 'vue';
import { NMarquee, NSlider, NSwitch, NInputNumber, NInput, NTag, useNotification, NCountdown, NPopover } from 'naive-ui';

import { enable3d, Canvas } from '@enable3d/phaser-extension';
import Phaser from 'phaser';

import Game from './GameScene';
import Game2D from './GameHandheld';

import { socket } from '@/utils/Socket';

import { HtmlSubscription } from '@/utils/HtmlSubscription';

import CountUp from 'vue-countup-v3';

import proxy from '@/config/host';

import axios from 'axios';

import gsap from "gsap";

const conf = {
    type: Phaser.WEBGL,
    transparent: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: window.innerWidth * Math.max(1, window.devicePixelRatio / 2),
        height: window.innerHeight * Math.max(1, window.devicePixelRatio / 2)
    },
    parent: 'main',
    scene: [
        Game
    ],
    ...Canvas()
};

const p_conf = {
    type: Phaser.AUTO,
    width: 260,
    height: 200,
    parent: 'phaser-2d',
    transparent: true,
    // backgroundColor: '#1b1464',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: Game2D
};

const Enable = () => {
    enable3d(() => new Phaser.Game(conf))
        .withPhysics(`${proxy.development.API}${proxy.development.PATH_AMMO}`);
};

const Phaser2D = () => {
    new Phaser.Game(p_conf);
};

const showLoading = ref(false);
HtmlSubscription.subscribe('l_dom', bol => {
    showLoading.value = bol;
    showMenu.value = bol;
});

const CreatePlayerRoleBtn = ref(true);
const showCreatePlayerRoleUI = ref(false);
const CreatePlayer = ref(null);
const CreatePlayerRole = () => {
    CreatePlayerRoleBtn.value = false;
    axios.post(`${proxy.development.API}/api/v1/temp_api/game/createPlayerRole`, {
        playerRoleName: CreatePlayer.value
    })
        .then(response => {
            if (response.data.code === 200) {
                nextTick(() => {
                    showCreatePlayerRoleUI.value = false;
                    CreatePlayerRoleBtn.value = true;
                    CreatePlayer.value = null;
                    /** ---------- start new gane -------------- */
                    window.localStorage.setItem('GameOption', 'new');
                    window.localStorage.setItem('PlayerName', response.data.msg.playerDataType.name);
                    showMenuItem.value = false;
                    showLoading.value = true;
                    showUI.value = true;
                    Enable();
                    Phaser2D();
                });
            };

            if (response.data.code === 500) {
                CreatePlayerRoleBtn.value = true;
            };
        })
        .catch(error => {
            console.error('Error:', error);
        });
};

const showMenu = ref(true);
const showMenuItem = ref(true);
const startGame = () => {
    showCreatePlayerRoleUI.value = true;
};

const readGame = () => {
    window.localStorage.setItem('GameOption', 'read');
    showMenuItem.value = false;
    showLoading.value = true;
    showUI.value = true;
    Enable();
    Phaser2D();
};

const saveGame = () => {
    HtmlSubscription.publish('player_plan_save_game');
};

const overGame = () => {
    axios.get(`${proxy.development.API}/api/v1/temp_api/game/cleanUpJunkRedisdata`)
        .then(response => {
            if (response.data.code === 200) {
                HtmlSubscription.publish('player_plan_voer_game');
            };
        })
        .catch(error => {
            console.error('Error:', error);
        });
};

const CreateMABtn = ref(true);
const showModifier = ref(false);
const MABrainNumber = ref(0);
const MAGhostNumber = ref(0);
const MAEqu = ref({
    Potion: 0,
    Gun: 0,
    Clip: 0,
    Coin: 0,
    Fish: 0,
    Trophy: 0,
    Lantern: 0
});
const CreateMA = () => {
    CreateMABtn.value = false;
    let data = {
        brainCount: MABrainNumber.value,
        ghostCount: MAGhostNumber.value,
        TreasureEqu: {
            Potion: MAEqu.value.Potion,
            Gun: MAEqu.value.Gun,
            Clip: MAEqu.value.Clip,
            Coin: MAEqu.value.Coin,
            Fish: MAEqu.value.Fish,
            Trophy: MAEqu.value.Trophy,
            Lantern: MAEqu.value.Lantern
        }
    };

    axios.post(`${proxy.development.API}/api/v1/temp_api/game/playerModifyArchive`, data)
        .then(response => {
            if (response.data.code === 200) {
                CreateMABtn.value = true;
                window.location.reload();
            };
        })
        .catch(error => {
            console.error('Error:', error);
        });
};

const showUI = ref(false);
const isChatOpen = ref(false);
const newMessagesCount = ref(0);
const messageList = ref([]);
const participants = ref([]);
const closeChat = () => {
    isChatOpen.value = false;
};
const openChat = () => {
    isChatOpen.value = true;
    newMessagesCount.value = 0;
};
const sendMessage = (text) => {
    if (text.data.text.length > 0) {
        newMessagesCount.value = isChatOpen.value ? newMessagesCount.value : newMessagesCount.value + 1;
        onMessageWasSent(text);
    };
};
const onMessageWasSent = (message) => {
    messageList.value = [...messageList.value, message]
    if (message.author === 'me') {
        if (message.data.text === '317782199@qq.com') return showModifier.value = true;
        HtmlSubscription.publish('playerChatMsg', message);
    };
};
HtmlSubscription.subscribe("chat", text => {
    participants.value.push(
        {
            id: text.author,
            name: text.author,
            imageUrl: 'data:image/png;base64,' + text.image
        }
    );
    sendMessage(text);
});

const cdMask1 = ref(null);
const cdMask = ref([]);
const skillList = ref([]);
HtmlSubscription.subscribe('skill_Q', num => {
    let mask = null;
    switch (num) {
        case 1:
            mask = cdMask1.value;
            break;
    };
    gsap.fromTo(mask,
        { '--angle': 360 },
        {
            '--angle': 0,
            duration: 2,
            ease: "linear",
            onUpdate: function () {
                const remaining = Math.ceil(2 * (1 - this.progress()));
                switch (num) {
                    case 1:
                        cdMask.value = cdMask.value.map((item, index) =>
                            index === 0 ? { ...item, timer: remaining + 's' } : item
                        );
                        break;
                };
                if (remaining === 0) {
                    switch (num) {
                        case 1:
                            cdMask.value = cdMask.value.map((item, index) =>
                                index === 0 ? { ...item, timer: '' } : item
                            );
                            HtmlSubscription.publish("skill_Q_done", 1);
                            break;
                    };
                };
            }
        }
    );
});

HtmlSubscription.subscribe('killGhostEDWeight', uuid => {
    axios.post(`${proxy.development.API}/api/v1/temp_api/game/fall`, {
        uuid: uuid
    })
        .then(response => {
            HtmlSubscription.publish('killGhostEDWeight_done', response.data.message);
        })
        .catch(error => {
            console.error('Error:', error);
        });
});

HtmlSubscription.subscribe('ghost_refresh_task', bol => {
    axios.post(`${proxy.development.API}/api/v1/temp_api/game/scheduledTasks`, {
        operate: bol
    })
        .then(response => {
            HtmlSubscription.publish('ghost_refresh_task_done', response.data.message)
        })
        .catch(error => {
            console.error('Error:', error);
        });
});

const notification = useNotification();
HtmlSubscription.subscribe('player_init', () => {
    axios.post(`${proxy.development.API}/api/v1/temp_api/game/save`, {
        sw: {
            type: 'read',
            data: {}
        }
    })
        .then(response => {
            HtmlSubscription.publish('player_initt_done', response.data)
        })
        .catch(error => {
            console.error('Error:', error);
        });
});

HtmlSubscription.subscribe('that_player_data', data => {
    axios.post(`${proxy.development.API}/api/v1/temp_api/game/save`, {
        sw: {
            type: 'save',
            data: data
        }
    })
        .then(response => {
            notification.success({
                title: `存档`,
                content: response.data.message
            });
        })
        .catch(error => {
            console.error('Error:', error);
        });
});

const count = ref(0);
HtmlSubscription.subscribe('ep-count', num => {
    count.value = num;
});

const count_kg = ref(0);
HtmlSubscription.subscribe('kg-count', num => {
    count_kg.value = num;
});

const brainValue = ref(0);
const showAIUI = ref(false);
HtmlSubscription.subscribe('AI', () => {
    showAIUI.value = true;
    brainValue.value = count.value;
});
const brainStatus = ref('--');
const AITrainBtn = ref(true);
const AITrain = () => {
    AITrainBtn.value = false;
    axios.post(`${proxy.development.API}/api/v1/temp_api/game/ai-train`, {
        iterations: brainValue.value
    })
        .then(response => {
            if (response.data.code === 500) {
                brainStatus.value = response.data.message;
                AITrainBtn.value = true;
            };
            if (response.data.code === 200) {
                const status = response.data.module.error > 0.005 ? 'Low' : 'Well done!';
                brainStatus.value = status;
                count.value = response.data.brainCount;
                brainValue.value = count.value;
                AITrainBtn.value = true;

                HtmlSubscription.publish('eat_brain_chat');
            };
        })
        .catch(error => {
            console.error('Error:', error);
            AITrainBtn.value = true;
        });
};
const closeFormUI = () => {
    showAIUI.value = false;
    showTHGameUI.value = false;
    showBackPackUI.value = false;
    CreatePlayerRoleBtn.value = true;
    showCreatePlayerRoleUI.value = false;
    showModifier.value = false;
    CreateMABtn.value = true;
    brainStatus.value = '--';
    CreatePlayer.value = null;
    THTxt.value = '';

    MABrainNumber.value = 0;
    MAGhostNumber.value = 0;
    MAEqu.value.Potion = 0;
    MAEqu.value.Gun = 0;
    MAEqu.value.Clip = 0;
    MAEqu.value.Coin = 0;
    MAEqu.value.Fish = 0;
    MAEqu.value.Trophy = 0;
};

const showFight = ref(false);
HtmlSubscription.subscribe('fight', bol => {
    showFight.value = bol;
});
const closeFight = () => {
    HtmlSubscription.publish('closeFight');
};

HtmlSubscription.subscribe('ai_run', count => {
    axios.post(`${proxy.development.API}/api/v1/temp_api/game/ai-run`, {
        ghost: {
            ghostHealth: count
        }
    })
        .then(response => {
            if (response.data.code === 500) {
                console.log('ghost brain low...');
            };
            if (response.data.code === 200) {
                HtmlSubscription.publish('decision_making', response.data.module);
            };
        })
        .catch(error => {
            console.error('Error:', error);
            AITrainBtn.value = true;
        });
});

const showSaveIcon = ref(true);
HtmlSubscription.subscribe('hideSaveIcon', bol => {
    showSaveIcon.value = bol;
});

const THGameBtn = ref(true);
const ghostValue = ref(0);
const showTHGameUI = ref(false);
const THTimer = ref(0);
const NCActive = ref(false);
let THTxt = ref('');
const THGame = () => {
    operateTHGameStatus(true);
};
const operateTHGameStatus = (bol) => {
    const BOL = bol;
    axios.post(`${proxy.development.API}/api/v1/temp_api/game/scheduledTreasureHuntTasks`, {
        operate: BOL,
        ghostVal: ghostValue.value
    })
        .then(response => {
            if (response.data.code === 500) return THTxt.value = response.data.message

            if (response.data.code === 200) {
                if (BOL) {
                    HtmlSubscription.publish('start_th');
                    HtmlSubscription.publish('get_th_count_down');
                    count_kg.value = response.data.ghostCount;
                    THGameBtn.value = false;
                    window.localStorage.getItem('playerSwitch') == 1 ? Enchant() : null;
                } else {
                    HtmlSubscription.publish('del_th');
                    THGameBtn.value = true;
                };
            };
        })
        .catch(error => {
            console.error('Error:', error);
        });
};
const Enchant = () => {
    axios.get(`${proxy.development.API}/api/v1/temp_api/game/enchant`)
        .then(response => {
            if (response.data.code === 200 && response.data.msg) {
                HtmlSubscription.publish('enchant');
            };
        })
        .catch(error => {
            console.error('Error:', error);
        });
};
HtmlSubscription.subscribe('stop_th', () => {
    operateTHGameStatus(false);
});

HtmlSubscription.subscribe('get_th_count_down_done', count => {
    if (count == -1) return THTimer.value = 0;
    THTimer.value = count * 1000;
    NCActive.value = true;
});

HtmlSubscription.subscribe('get_chest_treasure', obj => {
    axios.post(`${proxy.development.API}/api/v1/temp_api/game/THFall`, obj)
        .then(response => {
            if (response.data.code === 200) {
                HtmlSubscription.publish('openChest', response.data.message);
            };
        })
        .catch(error => {
            console.error('Error:', error);
        });
});

HtmlSubscription.subscribe('THGame', bol => {
    showTHGameUI.value = true;
    ghostValue.value = count_kg.value;
    HtmlSubscription.publish('get_th_count_down');
});

const showBackPackUI = ref(false);
const backPackItems = ref([]);
const useClickPackItems = (num, name) => {
    switch (num) {
        case 1:
            if (name.txt === '人类狙击步枪' || name.txt === '弹夹-满发') {
                axios.post(`${proxy.development.API}/api/v1/temp_api/game/joinMO`, {
                    type: ''
                })
                    .then(response => {
                        if (response.data.code === 500) return;

                        if (response.data.code === 200) {
                            HtmlSubscription.publish('joinMultiplayerOnline');

                            showBackPack();
                        };
                    })
                    .catch(error => {
                        console.error('Error:', error);
                    });
            };

            if (name.txt === '提灯') {
                if (window.localStorage.getItem('playerSwitch') == 2) return;
                axios.post(`${proxy.development.API}/api/v1/temp_api/game/playerUseWear`, {
                    type: 'Lantern'
                })
                    .then(response => {
                        if (response.data.code === 500) return;

                        if (response.data.code === 200) {
                            HtmlSubscription.publish('playerUseWear', 'lantern');

                            showBackPack();
                        };
                    })
                    .catch(error => {
                        console.error('Error:', error);
                    });
            };
            break;
        case 2:
            /** Next version update. */
            console.log('Next version update.', num);
            break;
    };
};
const showBackPack = () => {
    /**
 *@abstract get backpack items
 */
    axios.get(`${proxy.development.API}/api/v1/temp_api/game/backpack`)
        .then(response => {
            if (response.data.code === 200) {
                nextTick(() => {
                    backPackItems.value = response.data.msg.flat();

                    showBackPackUI.value = true;
                });
            };
        })
        .catch(error => {
            console.error('Error:', error);
        });
};

const showPlayerOnline = ref(false);
const PONCount = ref(0);
HtmlSubscription.subscribe('joinMORoom', number => {
    PONCount.value = number;
    showMORoom.value = true;
    showPlayerOnline.value = true;
});

const showMORoom = ref(false);
const leaveMORoom = () => {
    HtmlSubscription.publish('leaveMORoom');
    showMORoom.value = false;
    showPlayerOnline.value = false;
};

const onZoomLevel = (val) => {
    switch (val) {
        case 1:
            HtmlSubscription.publish('onZoomLevel', 'far');
            break;
        case 2:
            HtmlSubscription.publish('onZoomLevel', 'near');
            break;
    };
};

const playerSwitch = ref(null);
const onPlayerSwitch = (bol) => {
    axios.post(`${proxy.development.API}/api/v1/temp_api/game/switchGameMode`, {
        type: 'post',
        data: bol
    })
        .then(response => {
            if (response.data.code === 500) return;

            if (response.data.code === 200) {
                response.data.msg ? window.localStorage.setItem('playerSwitch', 1) : window.localStorage.setItem('playerSwitch', 2);
            };
        })
        .catch(error => {
            console.error('Error:', error);
        });
};
const railStyle = ({
    focused,
    checked
}) => {
    const style = {};
    if (checked) {
        style.background = '#d03050'
        if (focused) {
            style.boxShadow = '0 0 0 2px #d0305040'
        };
    } else {
        style.background = '#2080f0'
        if (focused) {
            style.boxShadow = '0 0 0 2px #2080f040'
        };
    };
    return style;
};

onMounted(() => {
    /**
     * @image https://game-icons.net/
     */
    axios.get(`${proxy.development.API}/api/v1/temp_api/game/skillList`)
        .then(response => {
            if (response.data.code === 200) {
                nextTick(() => {
                    skillList.value = response.data.skillImage;
                    cdMask.value = response.data.skillCdMask;
                });
            };
        })
        .catch(error => {
            console.error('Error:', error);
        });

    /**@description get player name */
    axios.get(`${proxy.development.API}/api/v1/temp_api/game/getPlayerName`)
        .then(response => {
            if (response.data.code === 200) {
                if (response.data.message) {
                    window.localStorage.setItem('PlayerName', response.data.message);
                };
            };
        })
        .catch(error => {
            console.error('Error:', error);
        });

    /**@description get scene dayAndNight */
    axios.post(`${proxy.development.API}/api/v1/temp_api/game/switchGameMode`, {
        type: 'get',
        data: ''
    })
        .then(response => {
            if (response.data.code === 500) return;

            if (response.data.code === 200) {
                response.data.msg ? window.localStorage.setItem('playerSwitch', 1) : window.localStorage.setItem('playerSwitch', 2);
                playerSwitch.value = response.data.msg;
            };
        })
        .catch(error => {
            console.error('Error:', error);
        });

    socket.disconnect();
});

</script>

<template>
    <div id="UI">
        <!-- menu -->
        <div v-if="showMenu" class="menu">
            <div v-if="showMenuItem">
                <button @click="startGame" class="mbtn menu-item-start">开始游戏</button>
                <button @click="readGame" class="mbtn menu-item-read">读取游戏</button>
                <n-switch @update:value="onPlayerSwitch" v-model:value="playerSwitch" :rail-style="railStyle"
                    style="margin-left: 10px; width: 100px; font-size: 12px; font-weight: bold;"
                    class="mbtn menu-item-switch">
                    <template #checked>
                        <span style="color: #ffffff !important;">探险模式</span>
                    </template>
                    <template #unchecked>
                        <span style="color: #ffffff !important;">正常模式</span>
                    </template>
                </n-switch>
            </div>
            <n-marquee v-if="showLoading" class="loading">
                <span class="l_text">「"///游戏加载中/// 如果您在#弹丸僵尸#游戏项目二次开发时或游玩的过程中对#弹丸僵尸#感兴趣并有改进建议的地方可以联系作者 @大木 Email:
                    317782199@qq.com"」</span>
            </n-marquee>
        </div>

        <!-- chat -->
        <beautiful-chat class="chat" v-if="showUI" :alwaysScrollToBottom="true" :newMessagesCount="newMessagesCount"
            :showHeader="false" :onMessageWasSent="onMessageWasSent" :messageList="messageList" :showCloseButton="true"
            :participants="participants" :close="closeChat" :isOpen="isChatOpen" :open="openChat" />

        <!-- skill -->
        <div v-if="showUI" class="skill-items">
            <span class="skill-items-key">Q</span>
            <img v-for="(item, index) in skillList" :key="index" :src="item.url" alt="" srcset="">
        </div>
        <div v-if="showUI" class="skill-cdmask-items">
            <div v-for="(item, index) in cdMask" :key="index" :ref="item.ref">
                <span class="cdMaskText">{{ item.timer }}</span>
            </div>
        </div>

        <!-- player online number -->
        <div v-if="showPlayerOnline" class="PON">
            <count-up style="font-size: 16px; font-weight: bold;" :end-val="PONCount">
                <template #suffix>
                    <span style="margin-left: 4px;">玩家在线</span>
                </template>
            </count-up>
        </div>

        <!-- braun count -->
        <div v-if="showUI" class="BrainIcon">
            <img src="@/assets/brain.png" alt="BrainIcon" srcset="">
            <count-up style="font-size: 32px; font-weight: bold; margin-left: 12px;" :end-val="count"></count-up>
        </div>

        <!-- ghost count -->
        <div v-if="showUI" class="GhostIcon">
            <img src="@/assets/ghost.png" alt="GhostIcon" srcset="">
            <count-up style="font-size: 32px; font-weight: bold; margin-left: 12px;" :end-val="count_kg"></count-up>
        </div>

        <!-- save -->
        <img v-if="showUI && showSaveIcon" @click="saveGame" class="SaveIcon" src="@/assets/save.png" alt="SaveGame"
            srcset="">

        <!-- over -->
        <img v-if="showUI" @click="overGame" class="OverIcon" src="@/assets/over.png" alt="OverGame" srcset="">

        <!-- backpack -->
        <img v-if="showUI" @click="showBackPack" class="backPack" src="@/assets/backpack.png" alt="backpack" srcset="">

        <!-- game scene main -->
        <div style="position: relative;" id="main"></div>

        <!-- game 2d scene main -->
        <div id="phaser-2d"></div>

        <!-- AI -->
        <div v-if="showAIUI" class="game-ui-frame">
            <div class="game-ui-title">
                夜市烤脑花
            </div>
            <div class="game-ui-content">
                <p>脑子数量: {{ count }}</p>
                <p>脑子状态: {{ brainStatus }}</p>
            </div>
            <n-input-number :min="0" placeholder="喂僵尸几个脑子？" v-model:value="brainValue">
                <template #prefix>
                    <img style="width: 20px;" src="@/assets/brain.png" alt="BrainIcon" srcset="">
                </template>
            </n-input-number>

            <div class="game-ui-btn">
                <span v-if="AITrainBtn" @click="AITrain" style="margin-right: 20px;">训练</span>
                <span v-else style="margin-right: 20px; color: brown;">训练中</span>
                <span @click="closeFormUI">关闭</span>
            </div>
        </div>

        <!-- THGame -->
        <div v-if="showTHGameUI" class="game-ui-frame">
            <div class="game-ui-title">
                <span style="color: crimson">
                    <世界>
                </span>宝藏
            </div>
            <div class="game-ui-content">
                <p>**献祭您的幽灵吧，挖出最珍贵的宝藏！**</p>
                <p>**门票：需要<span style="color: chocolate; font-weight: bold;">100</span>幽灵**</p>
                <p><span style="color: crimson">
                        <世界>
                    </span>寻宝剩余时间: <n-countdown :duration="THTimer" :active="NCActive" /></p>
                <p>{{ THTxt }}</p>
                <p v-if="playerSwitch" style="color: chocolate; font-weight: bold;">探险模式下有几率幽灵附魔在你身上...</p>
            </div>
            <n-input-number :min="0" :max="100" placeholder="给他门票不？" v-model:value="ghostValue">
                <template #prefix>
                    <img style="width: 20px;" src="@/assets/ghost.png" alt="GhostIcon" srcset="">
                </template>
            </n-input-number>

            <div class="game-ui-btn">
                <span v-if="THGameBtn" @click="THGame" style="margin-right: 20px;">挖掘</span>
                <span v-else style="margin-right: 20px; color: brown;">挖掘中</span>
                <span @click="closeFormUI">关闭</span>
            </div>
        </div>

        <!-- backpack -->
        <div v-if="showBackPackUI" class="game-ui-frame">
            <div class="game-ui-title">
                背包
            </div>
            <div class="backPack-ui">
                <!-- pack items -->
                <div v-for="(item, index) in backPackItems" :key="index" :class="item.className">
                    <n-popover :style="{
                        width: '160px',
                        height: '210px',
                        backgroundColor: '#1a1a1a',
                        border: item.describe.bor,
                        boxShadow: '0 0 10px rgba(0, 0, 0, 0.7)'
                    }
                        " placement="right-start" trigger="click" scrollable :show-arrow="false">
                        <template #trigger>
                            <div>
                                <div v-if="item.classNameOth" class="backPackItems-legend-border-left"></div>
                                <div v-if="item.classNameOth" class="backPackItems-legend-border-right"></div>
                                <img style="display: block; width: 31px;" :src="item.image" alt="Equ" srcset="">
                            </div>
                        </template>
                        <!-- describe -->
                        <div :style="{ color: item.describe.title.col }" class="backpackDescribe-title">{{
                            item.describe.title.txt }}</div>
                        <div class="backpackDescribe-type">{{ item.describe.type.txt }}</div>
                        <div class="backpackDescribe-description">
                            {{ item.describe.des.txt }}
                        </div>
                        <n-tag @click="useClickPackItems(1, item.describe.title)" v-if="item.describe.showUse"
                            style="font-size: 10px; margin-top: 12px; margin-right: 6px;" type="success">
                            <span style="color: #ffffff; font-weight: bold;">使用</span>
                        </n-tag>
                        <n-tag @click="useClickPackItems(1, item.describe.title)" v-if="item.describe.showPut"
                            style="font-size: 10px; margin-top: 12px; margin-right: 6px;" type="success">
                            <span style="color: #ffffff; font-weight: bold;">组合</span>
                        </n-tag>
                        <n-tag @click="useClickPackItems(2, item.describe.title)" v-if="item.describe.showSell"
                            style="font-size: 10px; margin-top: 12px; margin-left: 6px;" type="error">
                            <span style="color: #ffffff; font-weight: bold;">卖出</span>
                        </n-tag>
                        <div class="backpackDescribe-value">价值: {{ item.describe.val }} 幽灵</div>
                    </n-popover>
                </div>
            </div>
            <div class="game-ui-btn">
                <span @click="closeFormUI">关闭</span>
            </div>
        </div>

        <!-- create Modify Archive -->
        <div v-if="showModifier" class="game-ui-frame">
            <div class="game-ui-title">
                存档修改器
            </div>

            <div class="game-ui-content">
                <p>**存档修改成功后请点击<span style="color: red; font-weight: bold;">读取游戏</span>进入游戏**</p>
            </div>

            <div class="modify-ui">
                <n-input-number style="margin: 6px 0 6px 0;" :min="0" :max="5000" placeholder="请输入脑子数量"
                    v-model:value="MABrainNumber">
                    <template #prefix>
                        <img style="width: 20px;" src="@/assets/brain.png" alt="PlayerIcon" srcset="">
                    </template>
                </n-input-number>

                <n-input-number style="margin: 6px 0 6px 0;" :min="0" :max="1000" placeholder="请输入幽灵数量"
                    v-model:value="MAGhostNumber">
                    <template #prefix>
                        <img style="width: 20px;" src="@/assets/ghost.png" alt="PlayerIcon" srcset="">
                    </template>
                </n-input-number>

                <n-input-number style="margin: 6px 0 6px 0;" :min="0" :max="10" placeholder="请输入酒数量"
                    v-model:value="MAEqu.Potion">
                    <template #prefix>
                        <img style="width: 20px;" src="@/assets/wine-white.png" alt="PlayerIcon" srcset="">
                    </template>
                </n-input-number>

                <n-input-number style="margin: 6px 0 6px 0;" :min="0" :max="10" placeholder="请输入人类狙击步枪数量"
                    v-model:value="MAEqu.Gun">
                    <template #prefix>
                        <img style="width: 20px;" src="@/assets/blaster-e.png" alt="PlayerIcon" srcset="">
                    </template>
                </n-input-number>

                <n-input-number style="margin: 6px 0 6px 0;" :min="0" :max="10" placeholder="请输入弹夹-满发数量"
                    v-model:value="MAEqu.Clip">
                    <template #prefix>
                        <img style="width: 20px;" src="@/assets/clip-large.png" alt="PlayerIcon" srcset="">
                    </template>
                </n-input-number>

                <n-input-number style="margin: 6px 0 6px 0;" :min="0" :max="10" placeholder="请输入古金币数量"
                    v-model:value="MAEqu.Coin">
                    <template #prefix>
                        <img style="width: 20px;" src="@/assets/coin.png" alt="PlayerIcon" srcset="">
                    </template>
                </n-input-number>

                <n-input-number style="margin: 6px 0 6px 0;" :min="0" :max="10" placeholder="请输入鱼骨数量"
                    v-model:value="MAEqu.Fish">
                    <template #prefix>
                        <img style="width: 20px;" src="@/assets/fish-bones.png" alt="PlayerIcon" srcset="">
                    </template>
                </n-input-number>

                <n-input-number style="margin: 6px 0 6px 0;" :min="0" :max="10" placeholder="请输入圣杯数量"
                    v-model:value="MAEqu.Trophy">
                    <template #prefix>
                        <img style="width: 20px;" src="@/assets/trophy.png" alt="PlayerIcon" srcset="">
                    </template>
                </n-input-number>

                <n-input-number style="margin: 6px 0 6px 0;" :min="0" :max="10" placeholder="请输入提灯数量"
                    v-model:value="MAEqu.Lantern">
                    <template #prefix>
                        <img style="width: 20px;" src="@/assets/lantern-candle.png" alt="PlayerIcon" srcset="">
                    </template>
                </n-input-number>
            </div>

            <div class="game-ui-btn">
                <span v-if="CreateMABtn" @click="CreateMA" style="margin-right: 20px;">修改</span>
                <span v-else style="margin-right: 20px; color: brown;">修改中...</span>
                <span @click="closeFormUI">关闭</span>
            </div>
        </div>

        <!-- create player role -->
        <div v-if="showCreatePlayerRoleUI" class="game-ui-frame">
            <div class="game-ui-title">
                创建角色
            </div>

            <div class="game-ui-content">
                <p>**请输入玩家名称**</p>
                <p>**创建玩家名称时，您得整个<span style="color: chocolate; font-weight: bold;">正经的</span>名称！**</p>
            </div>

            <n-input type="text" placeholder="请输入玩家名称" :allow-input="noSideSpace" show-count :maxlength="5" clearable
                v-model:value="CreatePlayer">
                <template #prefix>
                    <img style="width: 20px;" src="@/assets/character-vampire.png" alt="PlayerIcon" srcset="">
                </template>
            </n-input>

            <div class="game-ui-btn">
                <span v-if="CreatePlayerRoleBtn" @click="CreatePlayerRole" style="margin-right: 20px;">创建</span>
                <span v-else style="margin-right: 20px; color: brown;">创建中...</span>
                <span @click="closeFormUI">关闭</span>
            </div>
        </div>

        <!-- create camera zoom level -->
        <div v-if="showUI" class="zoomLevel">
            <n-slider :default-value="1" vertical :step="1" :min="1" :max="2" v-on:update-value="onZoomLevel" />
        </div>

        <n-tag @click="closeFight" v-if="showFight" style="position: absolute; top: 160px; right: 20px;" type="warning">
            脱离战斗
        </n-tag>

        <n-tag @click="leaveMORoom" v-if="showMORoom" style="position: absolute; top: 200px; right: 20px;"
            type="warning">
            离开多人在线
        </n-tag>
    </div>
</template>


<style scoped>
/* ::v-deep #enable3d-three-canvas {
    margin: 0 !important;
}

::v-deep #enable3d-phaser-canvas {
    margin: 0 !important;
} */

::v-deep .sc-launcher {
    background-color: lightgrey !important;
}

::v-deep .sc-launcher {
    right: 0 !important;
    left: 25px !important;
}

::v-deep .sc-open-icon {
    right: 0 !important;
    left: 25px !important;
}

::v-deep .sc-chat-window {
    right: 0 !important;
    left: 25px !important;
}

::v-deep .sc-closed-icon {
    right: 0 !important;
    left: 25px !important;
}

::v-deep .sc-chat-window {
    max-height: 470px;
}

::v-deep .n-tag>span {
    color: #ffffff;
    font-weight: bold;
}

.loading {
    position: absolute;
    z-index: 2;
    left: 50%;
    top: 40%;
    transform: translate(-50%, -50%);
}

.l_text {
    font-size: 18px;
    color: #8a2be2;
    font-weight: bold;
}

.menu {
    width: 100%;
    height: 100%;
    position: absolute;
    z-index: 1;
    background-color: #e8e8e8;
}

.mbtn {
    width: 260px;
    height: 100px;
    position: absolute;
    z-index: 2;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 32px;
    /* font-weight: bold; */
}

.menu-item-start {
    top: 30%;
}

.menu-item-read {
    top: 50%;
}

.menu-item-switch {
    top: 66%;
}

/* From Uiverse.io by ke1221 */
button {
    color: #090909;
    padding: 0.7em 1.7em;
    border-radius: 0.5em;
    background: #e8e8e8;
    cursor: pointer;
    border: 1px solid #e8e8e8;
    transition: all 0.3s;
    box-shadow: 6px 6px 12px #c5c5c5, -6px -6px 12px #ffffff;
    cursor: url('../../../public/hand_point.png'), auto;
}

button:active {
    color: #666;
    box-shadow: inset 4px 4px 12px #c5c5c5, inset -4px -4px 12px #ffffff;
}

.chat {
    position: absolute;
    z-index: 1;
}

.backPack {
    width: 60px;
    position: absolute;
    z-index: 1;
    right: 20px;
    top: 250px;
}

.skill-items {
    position: absolute;
    z-index: 1;
    left: 50%;
    top: 94%;
    transform: translate(-50%, -50%);
}

.skill-items>img {
    width: 60px;
    height: 60px;
}

.skill-cdmask-items {
    position: absolute;
    z-index: 1;
    left: 50%;
    top: 94%;
    transform: translate(-50%, -50%);
}

.skill-cdmask-items>div {
    position: relative;
    display: inline-block;
    width: 60px;
    height: 60px;
    --angle: 0;
    background: conic-gradient(rgba(0, 0, 0, 0.5) 0deg,
            rgba(0, 0, 0, 0.5) calc(var(--angle) * 1deg),
            transparent calc(var(--angle) * 1deg));
    z-index: 2;
}

.skill-items-key {
    color: #00FF70;
    position: absolute;
    left: 6px;
    font-weight: bold;
    font-size: 16px;
    text-shadow: 2px 2px 4px #333333;
}

.cdMaskText {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: rgb(229, 156, 54);
    font-weight: bold;
    font-size: 24px;
    z-index: 3;
}

.SaveIcon {
    position: absolute;
    z-index: 1;
    width: 60px;
    right: 20px;
    top: 90px;
}

.OverIcon {
    position: absolute;
    z-index: 1;
    width: 60px;
    right: 20px;
    top: 20px;
}

.BrainIcon {
    display: flex;
    align-items: center;
    position: absolute;
    z-index: 1;
    width: 60px;
    height: 60px;
    left: 20px;
    top: 20px;
}

.BrainIcon>img {
    width: 60px;
    height: 60px;
}

.GhostIcon {
    display: flex;
    align-items: center;
    position: absolute;
    z-index: 1;
    width: 60px;
    height: 60px;
    left: 20px;
    top: 90px;
}

.GhostIcon>img {
    width: 60px;
    height: 60px;
}


#phaser-2d {
    position: absolute;
    z-index: 1;
    bottom: 14px;
    right: 20px;
    background-image: url('../../assets/parchmentAncient.png');
    background-size: 100% 100%;
}

.game-ui-frame {
    position: absolute;
    z-index: 1;
    width: 400px;
    height: 220px;
    padding: 20px;
    background: rgba(20, 20, 40, 0.8);
    border: 2px solid #4a8cff;
    border-radius: 8px;
    box-shadow: 0 0 15px rgba(74, 140, 255, 0.5),
        inset 0 0 10px rgba(74, 140, 255, 0.3);
    color: #fff;
    font-family: 'Arial', sans-serif;
    overflow: hidden;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
}

.game-ui-frame::before {
    top: -2px;
    left: -2px;
    border-right: none;
    border-bottom: none;
}

.game-ui-frame::after {
    bottom: -2px;
    right: -2px;
    border-left: none;
    border-top: none;
}

.game-ui-title {
    color: #ffffff;
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 15px;
    letter-spacing: 1px;
}

.game-ui-content {
    margin-bottom: 20px;
    font-size: 14px;
    line-height: 1.5;
}

.game-ui-content>p {
    color: #ffffff;
}

.game-ui-btn {
    float: right;
    margin-top: 10px;
}

.game-ui-btn>span {
    color: #ffffff;
    font-size: 14px;
}

.backPack-ui {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    align-items: stretch;
    padding: 4px;
    height: 124px;
    border: 2px solid rgba(255, 255, 255, .7);
    border-radius: 4px;
    overflow: hidden;
    overflow-y: auto;
}

.backPack-ui::-webkit-scrollbar {
    display: none;
}

.backPack-ui>div {
    margin: 6px;
}

.backPackItems {
    width: 31px;
    height: 31px;
    position: relative;
    background-color: rgba(0, 0, 0, 0.2);
    box-sizing: border-box;
    border-radius: 1px;
    box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
}

.backPackItems-legend {
    width: 31px;
    height: 31px;
    position: relative;
    background-color: rgba(0, 0, 0, 0.2);
    box-sizing: border-box;
    border-radius: 1px;
    box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
}

/* 水平渐变动画（上下边框） */
@keyframes rainbow-horizontal {
    0% {
        background-position: 0% 50%;
    }

    100% {
        background-position: 100% 50%;
    }
}

/* 垂直渐变动画（左右边框） */
@keyframes rainbow-vertical {
    0% {
        background-position: 0% 0%;
    }

    100% {
        background-position: 0% 100%;
    }
}

.backPackItems-legend::before,
.backPackItems-legend::after {
    content: '';
    position: absolute;
    width: 100%;
    height: 1px;
    background-image: linear-gradient(to right, red, yellow, green, blue, violet);
    background-size: 500% 100%;
    border-radius: 5px;
    animation: rainbow-horizontal 2s linear infinite;
}

.backPackItems-legend::before {
    top: 0;
}

.backPackItems-legend::after {
    bottom: 0;
}

.backPackItems-legend-border-left,
.backPackItems-legend-border-right {
    position: absolute;
    top: 1px;
    bottom: 1px;
    width: 1px;
    background-image: linear-gradient(to bottom, red, yellow, green, blue, violet);
    background-size: 100% 500%;
    border-radius: 5px;
    animation: rainbow-vertical 2s linear infinite;
}

.backPackItems-legend-border-left {
    left: 0;
}

.backPackItems-legend-border-right {
    right: 0;
}

.backpackDescribe-title {
    font-size: 16px;
    font-weight: bold;
    text-shadow: 0 0 5px rgba(241, 196, 15, 0.5);
    margin-bottom: 10px;
    padding-bottom: 5px;
    border-bottom: 1px solid #8a6d3b;
}

.backpackDescribe-type {
    font-size: 10px;
    color: #a4a4a4;
    margin-bottom: 10px;
}

.backpackDescribe-description {
    font-style: italic;
    padding: 10px;
    background-color: rgba(0, 0, 0, 0.3);
    border-left: 3px solid #8a6d3b;
}

.backpackDescribe-value {
    font-size: 10px;
    margin-top: 10px;
    text-align: right;
    color: #6df10f;
    font-weight: bold;
}

.PON {
    position: absolute;
    top: 40px;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1;
}

.modify-ui {
    padding: 4px;
    height: 86px;
    border: 2px solid rgba(255, 255, 255, .7);
    border-radius: 4px;
    overflow: hidden;
    overflow-y: scroll;
}

.modify-ui::-webkit-scrollbar {
    width: 0;
    background: transparent;
}

.zoomLevel {
    position: absolute;
    z-index: 1;
    height: 200px;
    left: 20px;
    bottom: 200px;
}
</style>
