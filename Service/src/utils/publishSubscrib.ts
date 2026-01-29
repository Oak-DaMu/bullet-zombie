/**
 * @author Da Mu
 * @version v1.1.0.cn.sy.202508010128
 * @mail 317782199@qq.com
 */
export default class publishSubscrib {
  static events = {};

  static subscribe(eventType: string | number, callback: any) {
    if (!publishSubscrib.events[eventType]) {
      publishSubscrib.events[eventType] = [];
    }
    publishSubscrib.events[eventType].push(callback);
  };

  static publish(eventType: string | number, data: any) {
    const callbacks = publishSubscrib.events[eventType];
    if (callbacks) {
      callbacks.forEach((callback: (arg0: any) => any) => callback(data));
    }
  };

  static unsubscribe(eventType: string | number, callback: any) {
    if (publishSubscrib.events[eventType]) {
      publishSubscrib.events[eventType] = publishSubscrib.events[eventType].filter((cb: any) => cb !== callback);
    }
  };
  
};