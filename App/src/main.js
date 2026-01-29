/**
 * @author Da Mu
 * @version v1.1.0.cn.sy.202508010128
 * @mail 317782199@qq.com
 */
import { createApp } from 'vue'
import App from './App.vue'
import router from './router';
import "./public-path";

import Chat from 'vue3-beautiful-chat';

// 定义特性标志
window.__VUE_PROD_DEVTOOLS__ = false;
window.__VUE_PROD_HYDRATION_MISMATCH_DETAILS__ = false;

const app = createApp(App)


let instance = null;

function render(props = {}) {
    const { container } = props;
    //   history = createWebHistory(window.__POWERED_BY_QIANKUN__ ? '/vue3' : '/');
    //   router = createRouter({
    //     history,
    //     routes,
    //   });

    instance = createApp(App);
    instance.use(router);
    instance.use(Chat);
    //   instance.use(store);
    instance.mount(container ? container.querySelector('#app') : '#app');
}

// 独立运行时
// @ts-ignore
if (!window.__POWERED_BY_QIANKUN__) {
    render();
}

export async function bootstrap() {
    console.log('%c%s', 'color: green;', 'vue3.0 app bootstraped');
}

export async function mount(props) {
    // storeTest(props);
    render(props);
    instance.config.globalProperties.$onGlobalStateChange = props.onGlobalStateChange;
    instance.config.globalProperties.$setGlobalState = props.setGlobalState;
}

export async function unmount() {
    instance.unmount();
    instance._container.innerHTML = '';
    instance = null;
    // router = null;
    // history.destroy();
}

// app.use(router)
// app.mount('#app')
