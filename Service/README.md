### backend v1.1.0.cn.sy.202508010128
```
📦 Service
├── 📂 logs
├── 📂 src
│   ├── 📂 TemplateApi
│   ├── 📂 TemplateApiAlService
│   │   └── 📄 TemplateApiAl.service.ts
│   ├── 📂 TemplateApiGameService
│   │   └── 📄 TemplateApiGame.service.ts
│   ├── 📂 TemplateApiGameSocketRoom
│   │   └── 📄 TemplateApiGame.room.ts
│   ├── 📂 TemplateApiGateway
│   │   └── 📄 TemplateApiChat.gateway.ts
│   ├── 📂 TemplateApiPlugService
│   │   ├──📄 TemplateApiController.ts
│   │   ├──📄 TemplateApi.dto.ts
│   │   ├──📄 TemplateApi.entity.ts
│   │   ├──📄 TemplateApi.module.ts
│   │   ├──📄 TemplateApi.service.ts
│   │   └──📄 TemplateApiSocketIoClient.service.ts 🚀
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
├── 📄 Dockerfile
├── 📄 package.json
└── 📄 README.md
```

### Service
```
cd Service
npm i
npm run dev

cat .env
```