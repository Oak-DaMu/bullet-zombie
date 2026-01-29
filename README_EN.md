[中文](README.md) | [English](README_EN.md)

# Hello Bullet zombie
v1.1.0.cn.sy.202508010128

### v1.1.0.cn.sy.202508010128 Official release version 🔥🔥🔥🔥🔥🔥🔥🔥
Hi，😊Bullet zombie v1.1.0.cn.sy.202508010128 The official version has been released. We hope that Bullet zombie can bring some inspiration and help to everyone. Thank you for your recognition and support! Game video introduction: [Portal](https://www.bilibili.com/video/BV1M58wz2Ehb/?vd_source=4935fce829bc1535d641a4e735b2349f)

### Bullet zombie v2.1.0-beta.1 new version 🚀🚀
Hi there! 😊 Bullet zombie v2.1.0-beta.1 welcomes a new version upgrade!
newly added: 1.Multiplayer online mode 2.Chatting in a multiplayer world 3.Treasure Hunt System 4.Backpack system 5.More random equipment (equipment interaction/description)

### Introduction to Bullet Zombie
Hi there! 😊 Welcome to Bullet Zombie, a casual game built on the Enable3D framework as a 3D extension for Phaser engine. If you're a frontend web developer tired of routine page layouts and intrigued by game graphics but unsure where to start, Bullet Zombie might just be your perfect gateway!

### About Bullet Zombie
The starting point of Bullet Zombie casual games is to be recommended by web front-end developers for educational and non-commercial projects. Game Graphics content includes 2D Graphics, 3D Graphics, and Physics. Project Code is quite rich, covering some common method logic used by developers in daily development and encapsulating it 💻， For example: automatic pathfinding module, player combat module, biological status module, message module, equipment drop/pick module, animation management module, skill tree module, biological (monster/BOSS) refresh module, AI model training decision module, etc. I hope Bullet zombie casual games can be your first choice for getting started with game graphics.

### Bullet zombie material
-  [kenney](https://kenney.nl/assets)
-  GameUI over icon by Alibaba Iconfont author StarZhang (Source: [https://www.iconfont.cn/])
-  GameUI save icon by Alibaba Iconfont author EOMOICONS (Source: [https://www.iconfont.cn/])
-  GameUI backpack icon by Alibaba Iconfont author EOMOICONS (Source: [https://www.iconfont.cn/])
-  GameUI chat user icon by Alibaba Iconfont author xiaoliang1314 (Source: [https://www.iconfont.cn/])
-  GameUI other icon by game-icons (Source: [https://game-icons.net/]) CC BY 3.0.
-  GameModel Brain/Brain.glb by author arifhas (Source: [https://sketchfab.com/3d-models/brain-e45c5753fdbf4b99b96f2c110622b945]) CC BY 4.0.

### Bullet zombie toolkit 🔗
-  [vue](https://vuejs.org/)  -front end.
-  [nest.js](https://nestjs.com/)  -backend.
-  [enable3d.io](https://enable3d.io/)  -engine. (Source: [https://github.com/enable3d/enable3d]) LGPL-3.0.
-  [phaser.io](https://phaser.io/)  -engine.
-  [THREE.js](https://threejs.org/)  -engine.
-  [gsap](https://gsap.com/)  -core.
-  [vue-beautiful-chat](https://matteo.merola.co/vue-beautiful-chat/)  -core.
-  [naiveui](https://www.naiveui.com/zh-CN/os-theme)  -core.
-  [brain.js](https://brain.js.org/#/)  -core.
-  [socket.io](https://socket.io/)  -core.
-  [ioredis](https://github.com/luin/ioredis)  -core.
-  [recast-navigation-js](https://github.com/isaac-mason/recast-navigation-js)  -core.

### Bullet zombie Core code directory structure
#### front end v2.1.0-beta.1
```
📦 App
├── 📂 src
│   ├── 📂 config
│   │   └── 📄 host.js
│   ├── 📂 utils
│   │   ├── 📄 HtmlSubscription.js
│   │   ├── 📄 LinkedList.js
│   │   └── 📄 Socket.js
│   └── 📂 views
│       └── 📂 Game
│           ├── 📄 GameHandheld.js
│           ├── 📄 GameIndex.vue
│           └── 📄 GameScene.js
├── 📄 package.json
└── 📄 README.md
```
#### backend v2.1.0-beta.1
```
📦 Service
├── 📂 logs
├── 📂 src
│   ├── 📂 TemplateApi
│   │   ├── 📂 TemplateApiAlService
│   │   │   └── 📄 TemplateApiAl.service.ts
│   │   ├── 📂 TemplateApiGameService
│   │   │   └── 📄 TemplateApiGame.service.ts
│   │   ├── 📂 TemplateApiGameSocketRoom
│   │   │   └── 📄 TemplateApiGame.room.ts
│   │   ├── 📂 TemplateApiGateway
│   │   │   └── 📄 TemplateApiChat.gateway.ts
│   │   └── 📂 TemplateApiPlugService
│   │       ├──📄 TemplateApiController.ts
│   │       ├──📄 TemplateApi.dto.ts
│   │       ├──📄 TemplateApi.entity.ts
│   │       ├──📄 TemplateApi.module.ts
│   │       ├──📄 TemplateApi.service.ts
│   │       └──📄 TemplateApiSocketIoClient.service.ts 🚀
│   ├── 📂 utils
│   │   ├── 📄 uploads.type.ts
│   │   └── 📄 winston.config.ts
│   ├── 📄 app.controller.ts
│   ├── 📄 app.module.ts
│   └── 📄 main.ts
├── 📂 static
│   ├── 📂 AI
│   │   ├── 📄 GhostTrainData.json
│   │   ├── 📄 GhostFinalDecision.json 🚀
│   │   └── 📄 GhostBehavioralDecisionMakingData.json 🚀
│   └── 📂 game
│       ├── 📂 ammo
│       ├── 📂 images
│       ├── 📂 models
│       └── 📄 save.json
├── 📄 config.yml 🚀
├── 📄 Dockerfile
├── 📄 package.json
└── 📄 README.md
```
### Multiplayer Online Service backend v2.1.0-beta.1
```
📦 MultiplayerOnlineService
├── 📂 logs
├── 📂 src
│   ├── 📂 TemplateApi
│   │   └── 📂 TemplateApiGameSocketRoom
│   │       └── 📄 TemplateApiGame.room.ts
│   │       📂 TemplateApiGateway
│   │       └── 📄 TemplateApiChat.gateway.ts
│   ├── 📄 app.controller.ts
│   ├── 📄 app.module.ts
│   └── 📄 main.ts
├── 📄 config.yml 🚀
├── 📄 Dockerfile
├── 📄 package.json
└── 📄 README.md
```
### Bullet zombie Process sequence
#### Login process sequence v1.0.0-beta.1
![Login process sequence](./App/src/assets/ProcessSequence-one.png)

#### Multi person online process sequence v2.1.0-beta.1
![Multi person online process sequence](./App/src/assets/ProcessSequence-three.png)

#### Other parts of the process sequence v1.0.0-beta.1
![Other parts of the process sequence](./App/src/assets/ProcessSequence-two.png)

### Multiplayer online architecture v2.1.0-beta.1
![Multiplayer online architecture](./App/src/assets/MultiplayerOnline-architecture.png)

### Multiplayer online architecture (refactoring) v2.1.0-beta.1
![Multiplayer online architecture (refactoring)](./App/src/assets/MultiplayerOnline-architecture-2.1.0.png)

### Bullet zombie Scene architecture 🎨
![Other parts of the process sequence](./App/src/assets/Scene-architecture.png)

### Bullet zombie Run video preview 🎬
#### Portal
[Game video introduction](https://www.bilibili.com/video/BV1M58wz2Ehb/?vd_source=4935fce829bc1535d641a4e735b2349f)

### Bullet zombie Partial Development Progress Preview 📷
#### Bullet zombie Game combat system v2.1.0-beta.1
![Game-combat-system](./App/src/assets/Development-progress-Game-combat-system.png)

#### Bullet zombie GameScene Equipment drop system v2.1.0-beta.1
![Game-combat-system](./App/src/assets/Development-progress-Equipment-drop-system.png)

#### Bullet zombie GameScene AI model training decision system v2.1.0-beta.1
![Game-combat-system](./App/src/assets/Development-progress-AI.png)

#### Bullet zombie GameScene backpack system v2.1.0-beta.1
![Game-combat-system](./App/src/assets/Development-progress-backpack-system.png)

#### Bullet zombie GameScene Treasure Hunt system v2.1.0-beta.1
![Game-combat-system](./App/src/assets/Development-progress-TH-system.png)

#### Bullet zombie GameScene Treasure Multiplayer online system v2.1.0-beta.1
![Game-combat-system](./App/src/assets/Development-progress-Multiplayer-online-system.png)

#### Bullet zombie Archive Modifier v1.2.3.rc
![Game-combat-system](./App/src/assets/Development-progress-MA-system.png)
![Game-combat-system](./App/src/assets/Development-progress-v1.2.3.rc-system.png)
![Game-combat-system](./App/src/assets/Development-progress-dayAndNight-system.png)

### Bullet zombie install
#### App ⚠️(Note: Installing Brain.js requires compilation in other environments such as Python. Please refer to the official website for details. Advise‌ node version 16.20.1)
```
cd App
npm i
npm run dev

cat src/config/host.js
```
#### Service
```
cd Service
npm i
npm run dev

cat .env
```
#### Multiplayer online Service
```
cd MultiplayerOnlineService
npm i
npm run dev

cat .env
```
#### Multiplayer online Service deploy
```
cd MultiplayerOnlineService
cat Dockerfile

# Linux Dockerfile
docker build -t bullet-zombie:v1.1.0.online.1 .
docker run -itd -p 1868:1868 --name bz-service bullet-zombie:v1.1.0.online.1
docker images
docker ps -a

# online config.yml
cat config.yml
```

### 🌟Module
- [x] **Automatic pathfinding v2.1.0-beta.1**
- [x] **Equipment dropping/picking up v2.1.0-beta.1**
- [x] **Animation Management v2.1.0-beta.1**
- [x] **Biological state v2.1.0-beta.1**
- [x] **Biology (Monster/BOSS) Refresh v2.1.0-beta.1**
- [x] **Player Battle v2.1.0-beta.1**
- [x] **Player state v2.1.0-beta.1** 🚀
- [x] **skill tree v1.0.0-beta.1**
- [x] **Message Chat v2.1.0-beta.1**
- [x] **physics v2.1.0-beta.1**
- [x] **AI model training v2.1.0-beta.1**
- [x] **Ghost decision-making v2.1.0-beta.1** 🚀
- [x] **Ghost fight v1.0.0-beta.1** 🚀
- [X] **backpack v2.1.0-beta.1** 🚀
- [X] **Treasure Hunt v2.1.0-beta.1** 🚀
- [ ] **weather**
- [X] **day and night**
- [x] **Multiplayer online v2.1.0-beta.1** 🚀🚀
- [x] **optimize** 🔥🔥

### Beta
#### **1. Optimization and adjustment of scene picking accuracy v1.0.0.beta.1**
#### **2. For the update of the new version v2.0.0-beta.1, the remaining known bugs in the early stages of iteration have been fixed. v2.0.0-beta.1**
#### **3. Multi-person online data reconstruction, Elegantly handle data, code optimization, and bug fixes for issues discovered/arising during code optimization v2.1.0.beta.1**

### rc
#### 1. Pre release version, comprehensively optimized for updates and iterations of past versions v1.0.0.beta.1 - v2.1.0.beta.1, fixing bugs discovered/generated during the optimization period
#### 2. Pre-release version, new cursor added, bug fix for AI model training interface timeout, optimization of movement distance, and skill amplitude optimization v1.1.1.rc
#### 3. Pre release version, added save modifier; Scene camera zoom, fix bug where player name cannot be obtained when reading game, fix bug where player image and name do not disappear when multiplayer participant player exits multiplayer online v1.2.3.rc
#### 4. v1.2.3.rc version blocked

### v1.1.0.cn.sy.202508010128
#### 1. Official release v1.1.0.cn.sy.202508010128

### 💖Support projects
If this project is helpful to you, welcome **Star** or **Fork**! Your encouragement is my driving force for progress, thank you for your recognition! 😊