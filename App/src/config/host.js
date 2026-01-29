export default {
    development: {
      // 开发环境接口请求
      API: 'http://192.168.50.61:3006',
      // 开发环境 cdn 路径
      CDN: '',
      // 静态资源
      PATH_IMG: '/game/images/',
      PATH_IMG_2D: 'game/images/',
      PATH_MODELS: '/game/models/',
      PATH_AMMO: '/game/ammo/',
      SOCKET_PATH: '/api/v1/ws'
    },
    test: {
      // 测试环境接口地址
      API: '',
      // 测试环境 cdn 路径
      CDN: '',
    },
    release: {
      // 正式环境接口地址
      API: '',
      // 正式环境 cdn 路径
      CDN: '',
    },
    site: {
      // 正式环境接口地址
      // API: '',
      // 正式环境 cdn 路径
      CDN: '',
    },
  };
  