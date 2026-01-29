const { defineConfig } = require('@vue/cli-service')
const path = require('path')
module.exports = defineConfig({
  publicPath: './',
  devServer: {
    headers: {
      'Access-Control-Allow-Origin':'*'
    }
  },
  configureWebpack: {
    output: {
      library: 'micro-app-3d',
      libraryTarget: 'umd',
      // chunkLoadingGlobal: `webpackJsonp_${name}`
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      }
    }
  },
  lintOnSave: false,
  transpileDependencies: true
})
