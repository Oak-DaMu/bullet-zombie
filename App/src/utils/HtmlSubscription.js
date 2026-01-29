/**
 * @author Da Mu
 * @version v1.1.0.cn.sy.202508010128
 * @mail 317782199@qq.com
 */
export class HtmlSubscription {
  static events = {};

  static subscribe(eventType, callback) {
    if (!HtmlSubscription.events[eventType]) {
      HtmlSubscription.events[eventType] = [];
    }
    HtmlSubscription.events[eventType].push(callback);
  };

  static publish(eventType, data) {
    const callbacks = HtmlSubscription.events[eventType];
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  };

  static unsubscribe(eventType, callback) {
    if (HtmlSubscription.events[eventType]) {
      HtmlSubscription.events[eventType] = HtmlSubscription.events[eventType].filter(cb => cb !== callback);
    }
  };
  
};