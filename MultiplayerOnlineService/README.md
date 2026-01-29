### Multiplayer Online Service backend v1.1.0.cn.sy.202508010128
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
# develop
# docker run -itd --network=host --name bz-service bullet-zombie:v1.1.0.online.1
docker run -itd -p 1868:1868 --name bz-service bullet-zombie:v1.1.0.online.1
docker images
docker ps -a

# online config.yml
cat config.yml
```