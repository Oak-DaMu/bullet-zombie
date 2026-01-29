/**
 * @author Da Mu
 * @version v1.1.0.cn.sy.202508010128
 * @mail 317782199@qq.com
 */
// import VueSocketIO from "vue-3-socket.io";
import SocketIO from "socket.io-client";

import proxy from '@/config/host';

const socket = SocketIO(proxy.development.API, {
    transports: ["websocket"],
    path: proxy.development.SOCKET_PATH,
    autoConnect: true
});

// const socketioVUE3 = new VueSocketIO({
//     debug: false,
//     connection: SocketIO(proxy.development.API, {
//         transports: ["websocket"],
//         path: proxy.development.SOCKET_PATH
//     }),
//     extraHeaders: { "Access-Control-Allow-Origin": "*" },
//     options: {
//         autoConnect: false,
//     }
// });


export {
    socket,
    // socketioVUE3
};