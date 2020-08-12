import { __decorate, __param } from "tslib";
import { EventEmitter, Inject, Injectable } from '@angular/core';
import { connect } from 'mqtt';
import * as extend from 'xtend';
import { BehaviorSubject, merge, Observable, Subject, Subscription, using } from 'rxjs';
import { filter, publish, publishReplay, refCount } from 'rxjs/operators';
import { MqttConnectionState } from './mqtt.model';
import { MqttClientService, MqttServiceConfig } from './mqtt.module';
import * as i0 from "@angular/core";
import * as i1 from "./mqtt.module";
/**
 * With an instance of MqttService, you can observe and subscribe to MQTT in multiple places, e.g. in different components,
 * to only subscribe to the broker once per MQTT filter.
 * It also handles proper unsubscription from the broker, if the last observable with a filter is closed.
 */
var MqttService = /** @class */ (function () {
    /**
     * The constructor needs [connection options]{@link IMqttServiceOptions} regarding the broker and some
     * options to configure behavior of this service, like if the connection to the broker
     * should be established on creation of this service or not.
     */
    function MqttService(options, client) {
        var _this = this;
        this.options = options;
        this.client = client;
        /** a map of all mqtt observables by filter */
        this.observables = {};
        /** the connection state */
        this.state = new BehaviorSubject(MqttConnectionState.CLOSED);
        /** an observable of the last mqtt message */
        this.messages = new Subject();
        this._clientId = this._generateClientId();
        this._connectTimeout = 10000;
        this._reconnectPeriod = 10000;
        this._url = undefined;
        this._onConnect = new EventEmitter();
        this._onReconnect = new EventEmitter();
        this._onClose = new EventEmitter();
        this._onOffline = new EventEmitter();
        this._onError = new EventEmitter();
        this._onEnd = new EventEmitter();
        this._onMessage = new EventEmitter();
        this._onSuback = new EventEmitter();
        this._onPacketsend = new EventEmitter();
        this._onPacketreceive = new EventEmitter();
        this._handleOnConnect = function (e) {
            if (_this.options.connectOnCreate === true) {
                Object.keys(_this.observables).forEach(function (filterString) {
                    _this.client.subscribe(filterString);
                });
            }
            _this.state.next(MqttConnectionState.CONNECTED);
            _this._onConnect.emit(e);
        };
        this._handleOnReconnect = function () {
            if (_this.options.connectOnCreate === true) {
                Object.keys(_this.observables).forEach(function (filterString) {
                    _this.client.subscribe(filterString);
                });
            }
            _this.state.next(MqttConnectionState.CONNECTING);
            _this._onReconnect.emit();
        };
        this._handleOnClose = function () {
            _this.state.next(MqttConnectionState.CLOSED);
            _this._onClose.emit();
        };
        this._handleOnOffline = function () {
            _this._onOffline.emit();
        };
        this._handleOnError = function (e) {
            _this._onError.emit(e);
            console.error(e);
        };
        this._handleOnEnd = function () {
            _this._onEnd.emit();
        };
        this._handleOnMessage = function (topic, msg, packet) {
            _this._onMessage.emit(packet);
            if (packet.cmd === 'publish') {
                _this.messages.next(packet);
            }
        };
        this._handleOnPacketsend = function (e) {
            _this._onPacketsend.emit();
        };
        this._handleOnPacketreceive = function (e) {
            _this._onPacketreceive.emit();
        };
        if (options.connectOnCreate !== false) {
            this.connect({}, client);
        }
        this.state.subscribe();
    }
    MqttService_1 = MqttService;
    Object.defineProperty(MqttService.prototype, "clientId", {
        /**
         * gets the _clientId
         */
        get: function () {
            return this._clientId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MqttService.prototype, "onConnect", {
        /** An EventEmitter to listen to connect messages */
        get: function () {
            return this._onConnect;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MqttService.prototype, "onReconnect", {
        /** An EventEmitter to listen to reconnect messages */
        get: function () {
            return this._onReconnect;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MqttService.prototype, "onClose", {
        /** An EventEmitter to listen to close messages */
        get: function () {
            return this._onClose;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MqttService.prototype, "onOffline", {
        /** An EventEmitter to listen to offline events */
        get: function () {
            return this._onOffline;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MqttService.prototype, "onError", {
        /** An EventEmitter to listen to error events */
        get: function () {
            return this._onError;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MqttService.prototype, "onEnd", {
        /** An EventEmitter to listen to close messages */
        get: function () {
            return this._onEnd;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MqttService.prototype, "onMessage", {
        /** An EventEmitter to listen to message events */
        get: function () {
            return this._onMessage;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MqttService.prototype, "onPacketsend", {
        /** An EventEmitter to listen to packetsend messages */
        get: function () {
            return this._onPacketsend;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MqttService.prototype, "onPacketreceive", {
        /** An EventEmitter to listen to packetreceive messages */
        get: function () {
            return this._onPacketreceive;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MqttService.prototype, "onSuback", {
        /** An EventEmitter to listen to suback events */
        get: function () {
            return this._onSuback;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * This static method shall be used to determine whether a MQTT
     * topic matches a given filter. The matching rules are specified in the MQTT
     * standard documentation and in the library test suite.
     *
     * @param  {string}  filter A filter may contain wildcards like '#' and '+'.
     * @param  {string}  topic  A topic may not contain wildcards.
     * @return {boolean}        true on match and false otherwise.
     */
    MqttService.filterMatchesTopic = function (filterString, topic) {
        if (filterString[0] === '#' && topic[0] === '$') {
            return false;
        }
        // Preparation: split and reverse on '/'. The JavaScript split function is sane.
        var fs = (filterString || '').split('/').reverse();
        var ts = (topic || '').split('/').reverse();
        // This function is tail recursive and compares both arrays one element at a time.
        var match = function () {
            // Cutting of the last element of both the filter and the topic using pop().
            var f = fs.pop();
            var t = ts.pop();
            switch (f) {
                // In case the filter level is '#', this is a match no matter whether
                // the topic is undefined on this level or not ('#' matches parent element as well!).
                case '#':
                    return true;
                // In case the filter level is '+', we shall dive into the recursion only if t is not undefined.
                case '+':
                    return t ? match() : false;
                // In all other cases the filter level must match the topic level,
                // both must be defined and the filter tail must match the topic
                // tail (which is determined by the recursive call of match()).
                default:
                    return f === t && (f === undefined ? true : match());
            }
        };
        return match();
    };
    /**
     * connect manually connects to the mqtt broker.
     */
    MqttService.prototype.connect = function (opts, client) {
        var options = extend(this.options || {}, opts);
        var protocol = options.protocol || 'ws';
        var hostname = options.hostname || 'localhost';
        if (options.url) {
            this._url = options.url;
        }
        else {
            this._url = protocol + "://" + hostname;
            this._url += options.port ? ":" + options.port : '';
            this._url += options.path ? "" + options.path : '';
        }
        this.state.next(MqttConnectionState.CONNECTING);
        var mergedOptions = extend({
            clientId: this._clientId,
            reconnectPeriod: this._reconnectPeriod,
            connectTimeout: this._connectTimeout
        }, options);
        if (this.client) {
            this.client.end(true);
        }
        if (!client) {
            this.client = connect(this._url, mergedOptions);
        }
        else {
            this.client = client;
        }
        this._clientId = mergedOptions.clientId;
        this.client.on('connect', this._handleOnConnect);
        this.client.on('reconnect', this._handleOnReconnect);
        this.client.on('close', this._handleOnClose);
        this.client.on('offline', this._handleOnOffline);
        this.client.on('error', this._handleOnError);
        this.client.stream.on('error', this._handleOnError);
        this.client.on('end', this._handleOnEnd);
        this.client.on('message', this._handleOnMessage);
        this.client.on('packetsend', this._handleOnPacketsend);
        this.client.on('packetreceive', this._handleOnPacketreceive);
    };
    /**
     * disconnect disconnects from the mqtt client.
     * This method `should` be executed when leaving the application.
     */
    MqttService.prototype.disconnect = function (force) {
        if (force === void 0) { force = true; }
        if (!this.client) {
            throw new Error('mqtt client not connected');
        }
        this.client.end(force);
    };
    /**
     * With this method, you can observe messages for a mqtt topic.
     * The observable will only emit messages matching the filter.
     * The first one subscribing to the resulting observable executes a mqtt subscribe.
     * The last one unsubscribing this filter executes a mqtt unsubscribe.
     * Every new subscriber gets the latest message.
     */
    MqttService.prototype.observeRetained = function (filterString, opts) {
        if (opts === void 0) { opts = { qos: 1 }; }
        return this._generalObserve(filterString, function () { return publishReplay(1); }, opts);
    };
    /**
     * With this method, you can observe messages for a mqtt topic.
     * The observable will only emit messages matching the filter.
     * The first one subscribing to the resulting observable executes a mqtt subscribe.
     * The last one unsubscribing this filter executes a mqtt unsubscribe.
     */
    MqttService.prototype.observe = function (filterString, opts) {
        if (opts === void 0) { opts = { qos: 1 }; }
        return this._generalObserve(filterString, function () { return publish(); }, opts);
    };
    /**
     * With this method, you can observe messages for a mqtt topic.
     * The observable will only emit messages matching the filter.
     * The first one subscribing to the resulting observable executes a mqtt subscribe.
     * The last one unsubscribing this filter executes a mqtt unsubscribe.
     * Depending on the publish function, the messages will either be replayed after new
     * subscribers subscribe or the messages are just passed through
     */
    MqttService.prototype._generalObserve = function (filterString, publishFn, opts) {
        var _this = this;
        if (!this.client) {
            throw new Error('mqtt client not connected');
        }
        if (!this.observables[filterString]) {
            var rejected_1 = new Subject();
            this.observables[filterString] = using(
            // resourceFactory: Do the actual ref-counting MQTT subscription.
            // refcount is decreased on unsubscribe.
            function () {
                var subscription = new Subscription();
                _this.client.subscribe(filterString, opts, function (err, granted) {
                    if (granted) { // granted can be undefined when an error occurs when the client is disconnecting
                        granted.forEach(function (granted_) {
                            if (granted_.qos === 128) {
                                delete _this.observables[granted_.topic];
                                _this.client.unsubscribe(granted_.topic);
                                rejected_1.error("subscription for '" + granted_.topic + "' rejected!");
                            }
                            _this._onSuback.emit({ filter: filterString, granted: granted_.qos !== 128 });
                        });
                    }
                });
                subscription.add(function () {
                    delete _this.observables[filterString];
                    _this.client.unsubscribe(filterString);
                });
                return subscription;
            }, 
            // observableFactory: Create the observable that is consumed from.
            // This part is not executed until the Observable returned by
            // `observe` gets actually subscribed.
            function (subscription) { return merge(rejected_1, _this.messages); })
                .pipe(filter(function (msg) { return MqttService_1.filterMatchesTopic(filterString, msg.topic); }), publishFn(), refCount());
        }
        return this.observables[filterString];
    };
    /**
     * This method returns an observable for a topic with optional options.
     * After subscribing, the actual mqtt publication will be executed and
     * the observable will emit an empty value and completes, if publishing was successful
     * or throws an error, if the publication fails.
     */
    MqttService.prototype.publish = function (topic, message, options) {
        var _this = this;
        if (!this.client) {
            throw new Error('mqtt client not connected');
        }
        return Observable.create(function (obs) {
            _this.client.publish(topic, message, options, function (err) {
                if (err) {
                    obs.error(err);
                }
                else {
                    obs.next(null);
                    obs.complete();
                }
            });
        });
    };
    /**
     * This method publishes a message for a topic with optional options.
     * If an error occurs, it will throw.
     */
    MqttService.prototype.unsafePublish = function (topic, message, options) {
        if (!this.client) {
            throw new Error('mqtt client not connected');
        }
        this.client.publish(topic, message, options, function (err) {
            if (err) {
                throw (err);
            }
        });
    };
    MqttService.prototype._generateClientId = function () {
        return 'client-' + Math.random().toString(36).substr(2, 19);
    };
    var MqttService_1;
    MqttService.ctorParameters = function () { return [
        { type: undefined, decorators: [{ type: Inject, args: [MqttServiceConfig,] }] },
        { type: undefined, decorators: [{ type: Inject, args: [MqttClientService,] }] }
    ]; };
    MqttService.ɵprov = i0.ɵɵdefineInjectable({ factory: function MqttService_Factory() { return new MqttService(i0.ɵɵinject(i1.MqttServiceConfig), i0.ɵɵinject(i1.MqttClientService)); }, token: MqttService, providedIn: "root" });
    MqttService = MqttService_1 = __decorate([
        Injectable({
            providedIn: 'root',
        }),
        __param(0, Inject(MqttServiceConfig)),
        __param(1, Inject(MqttClientService))
    ], MqttService);
    return MqttService;
}());
export { MqttService };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXF0dC5zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6Im5nOi8vbmd4LW1xdHQvIiwic291cmNlcyI6WyJsaWIvbXF0dC5zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEVBQUMsWUFBWSxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDL0QsT0FBTyxFQUFDLE9BQU8sRUFBOEMsTUFBTSxNQUFNLENBQUM7QUFDMUUsT0FBTyxLQUFLLE1BQU0sTUFBTSxPQUFPLENBQUM7QUFFaEMsT0FBTyxFQUFDLGVBQWUsRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFZLE9BQU8sRUFBRSxZQUFZLEVBQWtCLEtBQUssRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUNoSCxPQUFPLEVBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRSxhQUFhLEVBQUUsUUFBUSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFFeEUsT0FBTyxFQVdMLG1CQUFtQixFQUNwQixNQUFNLGNBQWMsQ0FBQztBQUV0QixPQUFPLEVBQUMsaUJBQWlCLEVBQUUsaUJBQWlCLEVBQUMsTUFBTSxlQUFlLENBQUM7OztBQUVuRTs7OztHQUlHO0FBSUg7SUFFRTs7OztPQUlHO0lBQ0gscUJBQ3FDLE9BQTRCLEVBQzVCLE1BQW9CO1FBRnpELGlCQVNDO1FBUm9DLFlBQU8sR0FBUCxPQUFPLENBQXFCO1FBQzVCLFdBQU0sR0FBTixNQUFNLENBQWM7UUFpRXpELDhDQUE4QztRQUN2QyxnQkFBVyxHQUF5RCxFQUFFLENBQUM7UUFDOUUsMkJBQTJCO1FBQ3BCLFVBQUssR0FBeUMsSUFBSSxlQUFlLENBQUMsbUJBQW1CLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDckcsNkNBQTZDO1FBQ3RDLGFBQVEsR0FBMEIsSUFBSSxPQUFPLEVBQWdCLENBQUM7UUFFN0QsY0FBUyxHQUFHLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBQ3JDLG9CQUFlLEdBQUcsS0FBSyxDQUFDO1FBQ3hCLHFC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QGFuZ3VsYXIvY29yZSc7XHJcbmltcG9ydCB7Y29ubmVjdCwgSUNsaWVudFN1YnNjcmliZU9wdGlvbnMsIElTdWJzY3JpcHRpb25HcmFudH0gZnJvbSAnbXF0dCc7XHJcbmltcG9ydCAqIGFzIGV4dGVuZCBmcm9tICd4dGVuZCc7XHJcblxyXG5pbXBvcnQge0JlaGF2aW9yU3ViamVjdCwgbWVyZ2UsIE9ic2VydmFibGUsIE9ic2VydmVyLCBTdWJqZWN0LCBTdWJzY3JpcHRpb24sIFVuc3Vic2NyaWJhYmxlLCB1c2luZ30gZnJvbSAncnhqcyc7XHJcbmltcG9ydCB7ZmlsdGVyLCBwdWJsaXNoLCBwdWJsaXNoUmVwbGF5LCByZWZDb3VudH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xyXG5cclxuaW1wb3J0IHtcclxuICBJTXF0dENsaWVudCxcclxuICBJTXF0dE1lc3NhZ2UsXHJcbiAgSU1xdHRTZXJ2aWNlT3B0aW9ucyxcclxuICBJT25Db25uZWN0RXZlbnQsXHJcbiAgSU9uRXJyb3JFdmVudCxcclxuICBJT25NZXNzYWdlRXZlbnQsXHJcbiAgSU9uUGFja2V0cmVjZWl2ZUV2ZW50LFxyXG4gIElPblBhY2tldHNlbmRFdmVudCxcclxuICBJT25TdWJhY2tFdmVudCxcclxuICBJUHVibGlzaE9wdGlvbnMsXHJcbiAgTXF0dENvbm5lY3Rpb25TdGF0ZVxyXG59IGZyb20gJy4vbXF0dC5tb2RlbCc7XHJcblxyXG5pbXBvcnQge01xdHRDbGllbnRTZXJ2aWNlLCBNcXR0U2VydmljZUNvbmZpZ30gZnJvbSAnLi9tcXR0Lm1vZHVsZSc7XHJcblxyXG4vKipcclxuICogV2l0aCBhbiBpbnN0YW5jZSBvZiBNcXR0U2VydmljZSwgeW91IGNhbiBvYnNlcnZlIGFuZCBzdWJzY3JpYmUgdG8gTVFUVCBpbiBtdWx0aXBsZSBwbGFjZXMsIGUuZy4gaW4gZGlmZmVyZW50IGNvbXBvbmVudHMsXHJcbiAqIHRvIG9ubHkgc3Vic2NyaWJlIHRvIHRoZSBicm9rZXIgb25jZSBwZXIgTVFUVCBmaWx0ZXIuXHJcbiAqIEl0IGFsc28gaGFuZGxlcyBwcm9wZXIgdW5zdWJzY3JpcHRpb24gZnJvbSB0aGUgYnJva2VyLCBpZiB0aGUgbGFzdCBvYnNlcnZhYmxlIHdpdGggYSBmaWx0ZXIgaXMgY2xvc2VkLlxyXG4gKi9cclxuQEluamVjdGFibGUoe1xyXG4gIHByb3ZpZGVkSW46ICdyb290JyxcclxufSlcclxuZXhwb3J0IGNsYXNzIE1xdHRTZXJ2aWNlIHtcclxuXHJcbiAgLyoqXHJcbiAgICogVGhlIGNvbnN0cnVjdG9yIG5lZWRzIFtjb25uZWN0aW9uIG9wdGlvbnNde0BsaW5rIElNcXR0U2VydmljZU9wdGlvbnN9IHJlZ2FyZGluZyB0aGUgYnJva2VyIGFuZCBzb21lXHJcbiAgICogb3B0aW9ucyB0byBjb25maWd1cmUgYmVoYXZpb3Igb2YgdGhpcyBzZXJ2aWNlLCBsaWtlIGlmIHRoZSBjb25uZWN0aW9uIHRvIHRoZSBicm9rZXJcclxuICAgKiBzaG91bGQgYmUgZXN0YWJsaXNoZWQgb24gY3JlYXRpb24gb2YgdGhpcyBzZXJ2aWNlIG9yIG5vdC5cclxuICAgKi9cclxuICBjb25zdHJ1Y3RvcihcclxuICAgIEBJbmplY3QoTXF0dFNlcnZpY2VDb25maWcpIHByaXZhdGUgb3B0aW9uczogSU1xdHRTZXJ2aWNlT3B0aW9ucyxcclxuICAgIEBJbmplY3QoTXF0dENsaWVudFNlcnZpY2UpIHByaXZhdGUgY2xpZW50PzogSU1xdHRDbGllbnRcclxuICApIHtcclxuICAgIGlmIChvcHRpb25zLmNvbm5lY3RPbkNyZWF0ZSAhPT0gZmFsc2UpIHtcclxuICAgICAgdGhpcy5jb25uZWN0KHt9LCBjbGllbnQpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuc3RhdGUuc3Vic2NyaWJlKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBnZXRzIHRoZSBfY2xpZW50SWRcclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IGNsaWVudElkKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuX2NsaWVudElkO1xyXG4gIH1cclxuXHJcbiAgLyoqIEFuIEV2ZW50RW1pdHRlciB0byBsaXN0ZW4gdG8gY29ubmVjdCBtZXNzYWdlcyAqL1xyXG4gIHB1YmxpYyBnZXQgb25Db25uZWN0KCk6IEV2ZW50RW1pdHRlcjxJT25Db25uZWN0RXZlbnQ+IHtcclxuICAgIHJldHVybiB0aGlzLl9vbkNvbm5lY3Q7XHJcbiAgfVxyXG5cclxuICAvKiogQW4gRXZlbnRFbWl0dGVyIHRvIGxpc3RlbiB0byByZWNvbm5lY3QgbWVzc2FnZXMgKi9cclxuICBwdWJsaWMgZ2V0IG9uUmVjb25uZWN0KCk6IEV2ZW50RW1pdHRlcjx2b2lkPiB7XHJcbiAgICByZXR1cm4gdGhpcy5fb25SZWNvbm5lY3Q7XHJcbiAgfVxyXG5cclxuICAvKiogQW4gRXZlbnRFbWl0dGVyIHRvIGxpc3RlbiB0byBjbG9zZSBtZXNzYWdlcyAqL1xyXG4gIHB1YmxpYyBnZXQgb25DbG9zZSgpOiBFdmVudEVtaXR0ZXI8dm9pZD4ge1xyXG4gICAgcmV0dXJuIHRoaXMuX29uQ2xvc2U7XHJcbiAgfVxyXG5cclxuICAvKiogQW4gRXZlbnRFbWl0dGVyIHRvIGxpc3RlbiB0byBvZmZsaW5lIGV2ZW50cyAqL1xyXG4gIHB1YmxpYyBnZXQgb25PZmZsaW5lKCk6IEV2ZW50RW1pdHRlcjx2b2lkPiB7XHJcbiAgICByZXR1cm4gdGhpcy5fb25PZmZsaW5lO1xyXG4gIH1cclxuXHJcbiAgLyoqIEFuIEV2ZW50RW1pdHRlciB0byBsaXN0ZW4gdG8gZXJyb3IgZXZlbnRzICovXHJcbiAgcHVibGljIGdldCBvbkVycm9yKCk6IEV2ZW50RW1pdHRlcjxJT25FcnJvckV2ZW50PiB7XHJcbiAgICByZXR1cm4gdGhpcy5fb25FcnJvcjtcclxuICB9XHJcblxyXG4gIC8qKiBBbiBFdmVudEVtaXR0ZXIgdG8gbGlzdGVuIHRvIGNsb3NlIG1lc3NhZ2VzICovXHJcbiAgcHVibGljIGdldCBvbkVuZCgpOiBFdmVudEVtaXR0ZXI8dm9pZD4ge1xyXG4gICAgcmV0dXJuIHRoaXMuX29uRW5kO1xyXG4gIH1cclxuXHJcbiAgLyoqIEFuIEV2ZW50RW1pdHRlciB0byBsaXN0ZW4gdG8gbWVzc2FnZSBldmVudHMgKi9cclxuICBwdWJsaWMgZ2V0IG9uTWVzc2FnZSgpOiBFdmVudEVtaXR0ZXI8SU9uTWVzc2FnZUV2ZW50PiB7XHJcbiAgICByZXR1cm4gdGhpcy5fb25NZXNzYWdlO1xyXG4gIH1cclxuXHJcbiAgLyoqIEFuIEV2ZW50RW1pdHRlciB0byBsaXN0ZW4gdG8gcGFja2V0c2VuZCBtZXNzYWdlcyAqL1xyXG4gIHB1YmxpYyBnZXQgb25QYWNrZXRzZW5kKCk6IEV2ZW50RW1pdHRlcjxJT25QYWNrZXRzZW5kRXZlbnQ+IHtcclxuICAgIHJldHVybiB0aGlzLl9vblBhY2tldHNlbmQ7XHJcbiAgfVxyXG5cclxuICAvKiogQW4gRXZlbnRFbWl0dGVyIHRvIGxpc3RlbiB0byBwYWNrZXRyZWNlaXZlIG1lc3NhZ2VzICovXHJcbiAgcHVibGljIGdldCBvblBhY2tldHJlY2VpdmUoKTogRXZlbnRFbWl0dGVyPElPblBhY2tldHJlY2VpdmVFdmVudD4ge1xyXG4gICAgcmV0dXJuIHRoaXMuX29uUGFja2V0cmVjZWl2ZTtcclxuICB9XHJcblxyXG4gIC8qKiBBbiBFdmVudEVtaXR0ZXIgdG8gbGlzdGVuIHRvIHN1YmFjayBldmVudHMgKi9cclxuICBwdWJsaWMgZ2V0IG9uU3ViYWNrKCk6IEV2ZW50RW1pdHRlcjxJT25TdWJhY2tFdmVudD4ge1xyXG4gICAgcmV0dXJuIHRoaXMuX29uU3ViYWNrO1xyXG4gIH1cclxuICAvKiogYSBtYXAgb2YgYWxsIG1xdHQgb2JzZXJ2YWJsZXMgYnkgZmlsdGVyICovXHJcbiAgcHVibGljIG9ic2VydmFibGVzOiB7IFtmaWx0ZXJTdHJpbmc6IHN0cmluZ106IE9ic2VydmFibGU8SU1xdHRNZXNzYWdlPiB9ID0ge307XHJcbiAgLyoqIHRoZSBjb25uZWN0aW9uIHN0YXRlICovXHJcbiAgcHVibGljIHN0YXRlOiBCZWhhdmlvclN1YmplY3Q8TXF0dENvbm5lY3Rpb25TdGF0ZT4gPSBuZXcgQmVoYXZpb3JTdWJqZWN0KE1xdHRDb25uZWN0aW9uU3RhdGUuQ0xPU0VEKTtcclxuICAvKiogYW4gb2JzZXJ2YWJsZSBvZiB0aGUgbGFzdCBtcXR0IG1lc3NhZ2UgKi9cclxuICBwdWJsaWMgbWVzc2FnZXM6IFN1YmplY3Q8SU1xdHRNZXNzYWdlPiA9IG5ldyBTdWJqZWN0PElNcXR0TWVzc2FnZT4oKTtcclxuXHJcbiAgcHJpdmF0ZSBfY2xpZW50SWQgPSB0aGlzLl9nZW5lcmF0ZUNsaWVudElkKCk7XHJcbiAgcHJpdmF0ZSBfY29ubmVjdFRpbWVvdXQgPSAxMDAwMDtcclxuICBwcml2YXRlIF9yZWNvbm5lY3RQZXJpb2QgPSAxMDAwMDtcclxuICBwcml2YXRlIF91cmw6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcclxuXHJcbiAgcHJpdmF0ZSBfb25Db25uZWN0OiBFdmVudEVtaXR0ZXI8SU9uQ29ubmVjdEV2ZW50PiA9IG5ldyBFdmVudEVtaXR0ZXI8SU9uQ29ubmVjdEV2ZW50PigpO1xyXG4gIHByaXZhdGUgX29uUmVjb25uZWN0OiBFdmVudEVtaXR0ZXI8dm9pZD4gPSBuZXcgRXZlbnRFbWl0dGVyPHZvaWQ+KCk7XHJcbiAgcHJpdmF0ZSBfb25DbG9zZTogRXZlbnRFbWl0dGVyPHZvaWQ+ID0gbmV3IEV2ZW50RW1pdHRlcjx2b2lkPigpO1xyXG4gIHByaXZhdGUgX29uT2ZmbGluZTogRXZlbnRFbWl0dGVyPHZvaWQ+ID0gbmV3IEV2ZW50RW1pdHRlcjx2b2lkPigpO1xyXG4gIHByaXZhdGUgX29uRXJyb3I6IEV2ZW50RW1pdHRlcjxJT25FcnJvckV2ZW50PiA9IG5ldyBFdmVudEVtaXR0ZXI8SU9uRXJyb3JFdmVudD4oKTtcclxuICBwcml2YXRlIF9vbkVuZDogRXZlbnRFbWl0dGVyPHZvaWQ+ID0gbmV3IEV2ZW50RW1pdHRlcjx2b2lkPigpO1xyXG4gIHByaXZhdGUgX29uTWVzc2FnZTogRXZlbnRFbWl0dGVyPElPbk1lc3NhZ2VFdmVudD4gPSBuZXcgRXZlbnRFbWl0dGVyPElPbk1lc3NhZ2VFdmVudD4oKTtcclxuICBwcml2YXRlIF9vblN1YmFjazogRXZlbnRFbWl0dGVyPElPblN1YmFja0V2ZW50PiA9IG5ldyBFdmVudEVtaXR0ZXI8SU9uU3ViYWNrRXZlbnQ+KCk7XHJcbiAgcHJpdmF0ZSBfb25QYWNrZXRzZW5kOiBFdmVudEVtaXR0ZXI8SU9uUGFja2V0c2VuZEV2ZW50PiA9IG5ldyBFdmVudEVtaXR0ZXI8SU9uUGFja2V0c2VuZEV2ZW50PigpO1xyXG4gIHByaXZhdGUgX29uUGFja2V0cmVjZWl2ZTogRXZlbnRFbWl0dGVyPElPblBhY2tldHJlY2VpdmVFdmVudD4gPSBuZXcgRXZlbnRFbWl0dGVyPElPblBhY2tldHJlY2VpdmVFdmVudD4oKTtcclxuXHJcbiAgLyoqXHJcbiAgICogVGhpcyBzdGF0aWMgbWV0aG9kIHNoYWxsIGJlIHVzZWQgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgYSBNUVRUXHJcbiAgICogdG9waWMgbWF0Y2hlcyBhIGdpdmVuIGZpbHRlci4gVGhlIG1hdGNoaW5nIHJ1bGVzIGFyZSBzcGVjaWZpZWQgaW4gdGhlIE1RVFRcclxuICAgKiBzdGFuZGFyZCBkb2N1bWVudGF0aW9uIGFuZCBpbiB0aGUgbGlicmFyeSB0ZXN0IHN1aXRlLlxyXG4gICAqXHJcbiAgICogQHBhcmFtICB7c3RyaW5nfSAgZmlsdGVyIEEgZmlsdGVyIG1heSBjb250YWluIHdpbGRjYXJkcyBsaWtlICcjJyBhbmQgJysnLlxyXG4gICAqIEBwYXJhbSAge3N0cmluZ30gIHRvcGljICBBIHRvcGljIG1heSBub3QgY29udGFpbiB3aWxkY2FyZHMuXHJcbiAgICogQHJldHVybiB7Ym9vbGVhbn0gICAgICAgIHRydWUgb24gbWF0Y2ggYW5kIGZhbHNlIG90aGVyd2lzZS5cclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIGZpbHRlck1hdGNoZXNUb3BpYyhmaWx0ZXJTdHJpbmc6IHN0cmluZywgdG9waWM6IHN0cmluZyk6IGJvb2xlYW4ge1xyXG4gICAgaWYgKGZpbHRlclN0cmluZ1swXSA9PT0gJyMnICYmIHRvcGljWzBdID09PSAnJCcpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgLy8gUHJlcGFyYXRpb246IHNwbGl0IGFuZCByZXZlcnNlIG9uICcvJy4gVGhlIEphdmFTY3JpcHQgc3BsaXQgZnVuY3Rpb24gaXMgc2FuZS5cclxuICAgIGNvbnN0IGZzID0gKGZpbHRlclN0cmluZyB8fCAnJykuc3BsaXQoJy8nKS5yZXZlcnNlKCk7XHJcbiAgICBjb25zdCB0cyA9ICh0b3BpYyB8fCAnJykuc3BsaXQoJy8nKS5yZXZlcnNlKCk7XHJcbiAgICAvLyBUaGlzIGZ1bmN0aW9uIGlzIHRhaWwgcmVjdXJzaXZlIGFuZCBjb21wYXJlcyBib3RoIGFycmF5cyBvbmUgZWxlbWVudCBhdCBhIHRpbWUuXHJcbiAgICBjb25zdCBtYXRjaCA9ICgpOiBib29sZWFuID0+IHtcclxuICAgICAgLy8gQ3V0dGluZyBvZiB0aGUgbGFzdCBlbGVtZW50IG9mIGJvdGggdGhlIGZpbHRlciBhbmQgdGhlIHRvcGljIHVzaW5nIHBvcCgpLlxyXG4gICAgICBjb25zdCBmID0gZnMucG9wKCk7XHJcbiAgICAgIGNvbnN0IHQgPSB0cy5wb3AoKTtcclxuICAgICAgc3dpdGNoIChmKSB7XHJcbiAgICAgICAgLy8gSW4gY2FzZSB0aGUgZmlsdGVyIGxldmVsIGlzICcjJywgdGhpcyBpcyBhIG1hdGNoIG5vIG1hdHRlciB3aGV0aGVyXHJcbiAgICAgICAgLy8gdGhlIHRvcGljIGlzIHVuZGVmaW5lZCBvbiB0aGlzIGxldmVsIG9yIG5vdCAoJyMnIG1hdGNoZXMgcGFyZW50IGVsZW1lbnQgYXMgd2VsbCEpLlxyXG4gICAgICAgIGNhc2UgJyMnOlxyXG4gICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgLy8gSW4gY2FzZSB0aGUgZmlsdGVyIGxldmVsIGlzICcrJywgd2Ugc2hhbGwgZGl2ZSBpbnRvIHRoZSByZWN1cnNpb24gb25seSBpZiB0IGlzIG5vdCB1bmRlZmluZWQuXHJcbiAgICAgICAgY2FzZSAnKyc6XHJcbiAgICAgICAgICByZXR1cm4gdCA/IG1hdGNoKCkgOiBmYWxzZTtcclxuICAgICAgICAvLyBJbiBhbGwgb3RoZXIgY2FzZXMgdGhlIGZpbHRlciBsZXZlbCBtdXN0IG1hdGNoIHRoZSB0b3BpYyBsZXZlbCxcclxuICAgICAgICAvLyBib3RoIG11c3QgYmUgZGVmaW5lZCBhbmQgdGhlIGZpbHRlciB0YWlsIG11c3QgbWF0Y2ggdGhlIHRvcGljXHJcbiAgICAgICAgLy8gdGFpbCAod2hpY2ggaXMgZGV0ZXJtaW5lZCBieSB0aGUgcmVjdXJzaXZlIGNhbGwgb2YgbWF0Y2goKSkuXHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgIHJldHVybiBmID09PSB0ICYmIChmID09PSB1bmRlZmluZWQgPyB0cnVlIDogbWF0Y2goKSk7XHJcbiAgICAgIH1cclxuICAgIH07XHJcbiAgICByZXR1cm4gbWF0Y2goKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIGNvbm5lY3QgbWFudWFsbHkgY29ubmVjdHMgdG8gdGhlIG1xdHQgYnJva2VyLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBjb25uZWN0KG9wdHM/OiBJTXF0dFNlcnZpY2VPcHRpb25zLCBjbGllbnQ/OiBJTXF0dENsaWVudCkge1xyXG4gICAgY29uc3Qgb3B0aW9ucyA9IGV4dGVuZCh0aGlzLm9wdGlvbnMgfHwge30sIG9wdHMpO1xyXG4gICAgY29uc3QgcHJvdG9jb2wgPSBvcHRpb25zLnByb3RvY29sIHx8ICd3cyc7XHJcbiAgICBjb25zdCBob3N0bmFtZSA9IG9wdGlvbnMuaG9zdG5hbWUgfHwgJ2xvY2FsaG9zdCc7XHJcbiAgICBpZiAob3B0aW9ucy51cmwpIHtcclxuICAgICAgdGhpcy5fdXJsID0gb3B0aW9ucy51cmw7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLl91cmwgPSBgJHtwcm90b2NvbH06Ly8ke2hvc3RuYW1lfWA7XHJcbiAgICAgIHRoaXMuX3VybCArPSBvcHRpb25zLnBvcnQgPyBgOiR7b3B0aW9ucy5wb3J0fWAgOiAnJztcclxuICAgICAgdGhpcy5fdXJsICs9IG9wdGlvbnMucGF0aCA/IGAke29wdGlvbnMucGF0aH1gIDogJyc7XHJcbiAgICB9XHJcbiAgICB0aGlzLnN0YXRlLm5leHQoTXF0dENvbm5lY3Rpb25TdGF0ZS5DT05ORUNUSU5HKTtcclxuICAgIGNvbnN0IG1lcmdlZE9wdGlvbnMgPSBleHRlbmQoe1xyXG4gICAgICBjbGllbnRJZDogdGhpcy5fY2xpZW50SWQsXHJcbiAgICAgIHJlY29ubmVjdFBlcmlvZDogdGhpcy5fcmVjb25uZWN0UGVyaW9kLFxyXG4gICAgICBjb25uZWN0VGltZW91dDogdGhpcy5fY29ubmVjdFRpbWVvdXRcclxuICAgIH0sIG9wdGlvbnMpO1xyXG5cclxuICAgIGlmICh0aGlzLmNsaWVudCkge1xyXG4gICAgICB0aGlzLmNsaWVudC5lbmQodHJ1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFjbGllbnQpIHtcclxuICAgICAgdGhpcy5jbGllbnQgPSAoY29ubmVjdCh0aGlzLl91cmwsIG1lcmdlZE9wdGlvbnMpIGFzIElNcXR0Q2xpZW50KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMuY2xpZW50ID0gY2xpZW50O1xyXG4gICAgfVxyXG4gICAgdGhpcy5fY2xpZW50SWQgPSBtZXJnZWRPcHRpb25zLmNsaWVudElkO1xyXG5cclxuICAgIHRoaXMuY2xpZW50Lm9uKCdjb25uZWN0JywgdGhpcy5faGFuZGxlT25Db25uZWN0KTtcclxuICAgIHRoaXMuY2xpZW50Lm9uKCdyZWNvbm5lY3QnLCB0aGlzLl9oYW5kbGVPblJlY29ubmVjdCk7XHJcbiAgICB0aGlzLmNsaWVudC5vbignY2xvc2UnLCB0aGlzLl9oYW5kbGVPbkNsb3NlKTtcclxuICAgIHRoaXMuY2xpZW50Lm9uKCdvZmZsaW5lJywgdGhpcy5faGFuZGxlT25PZmZsaW5lKTtcclxuICAgIHRoaXMuY2xpZW50Lm9uKCdlcnJvcicsIHRoaXMuX2hhbmRsZU9uRXJyb3IpO1xyXG4gICAgdGhpcy5jbGllbnQuc3RyZWFtLm9uKCdlcnJvcicsIHRoaXMuX2hhbmRsZU9uRXJyb3IpO1xyXG4gICAgdGhpcy5jbGllbnQub24oJ2VuZCcsIHRoaXMuX2hhbmRsZU9uRW5kKTtcclxuICAgIHRoaXMuY2xpZW50Lm9uKCdtZXNzYWdlJywgdGhpcy5faGFuZGxlT25NZXNzYWdlKTtcclxuICAgIHRoaXMuY2xpZW50Lm9uKCdwYWNrZXRzZW5kJywgdGhpcy5faGFuZGxlT25QYWNrZXRzZW5kKTtcclxuICAgIHRoaXMuY2xpZW50Lm9uKCdwYWNrZXRyZWNlaXZlJywgdGhpcy5faGFuZGxlT25QYWNrZXRyZWNlaXZlKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIGRpc2Nvbm5lY3QgZGlzY29ubmVjdHMgZnJvbSB0aGUgbXF0dCBjbGllbnQuXHJcbiAgICogVGhpcyBtZXRob2QgYHNob3VsZGAgYmUgZXhlY3V0ZWQgd2hlbiBsZWF2aW5nIHRoZSBhcHBsaWNhdGlvbi5cclxuICAgKi9cclxuICBwdWJsaWMgZGlzY29ubmVjdChmb3JjZSA9IHRydWUpIHtcclxuICAgIGlmICghdGhpcy5jbGllbnQpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdtcXR0IGNsaWVudCBub3QgY29ubmVjdGVkJyk7XHJcbiAgICB9XHJcbiAgICB0aGlzLmNsaWVudC5lbmQoZm9yY2UpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogV2l0aCB0aGlzIG1ldGhvZCwgeW91IGNhbiBvYnNlcnZlIG1lc3NhZ2VzIGZvciBhIG1xdHQgdG9waWMuXHJcbiAgICogVGhlIG9ic2VydmFibGUgd2lsbCBvbmx5IGVtaXQgbWVzc2FnZXMgbWF0Y2hpbmcgdGhlIGZpbHRlci5cclxuICAgKiBUaGUgZmlyc3Qgb25lIHN1YnNjcmliaW5nIHRvIHRoZSByZXN1bHRpbmcgb2JzZXJ2YWJsZSBleGVjdXRlcyBhIG1xdHQgc3Vic2NyaWJlLlxyXG4gICAqIFRoZSBsYXN0IG9uZSB1bnN1YnNjcmliaW5nIHRoaXMgZmlsdGVyIGV4ZWN1dGVzIGEgbXF0dCB1bnN1YnNjcmliZS5cclxuICAgKiBFdmVyeSBuZXcgc3Vic2NyaWJlciBnZXRzIHRoZSBsYXRlc3QgbWVzc2FnZS5cclxuICAgKi9cclxuICBwdWJsaWMgb2JzZXJ2ZVJldGFpbmVkKGZpbHRlclN0cmluZzogc3RyaW5nLCBvcHRzOiBJQ2xpZW50U3Vic2NyaWJlT3B0aW9ucyA9IHtxb3M6IDF9KTogT2JzZXJ2YWJsZTxJTXF0dE1lc3NhZ2U+IHtcclxuICAgIHJldHVybiB0aGlzLl9nZW5lcmFsT2JzZXJ2ZShmaWx0ZXJTdHJpbmcsICgpID0+IHB1Ymxpc2hSZXBsYXkoMSksIG9wdHMpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogV2l0aCB0aGlzIG1ldGhvZCwgeW91IGNhbiBvYnNlcnZlIG1lc3NhZ2VzIGZvciBhIG1xdHQgdG9waWMuXHJcbiAgICogVGhlIG9ic2VydmFibGUgd2lsbCBvbmx5IGVtaXQgbWVzc2FnZXMgbWF0Y2hpbmcgdGhlIGZpbHRlci5cclxuICAgKiBUaGUgZmlyc3Qgb25lIHN1YnNjcmliaW5nIHRvIHRoZSByZXN1bHRpbmcgb2JzZXJ2YWJsZSBleGVjdXRlcyBhIG1xdHQgc3Vic2NyaWJlLlxyXG4gICAqIFRoZSBsYXN0IG9uZSB1bnN1YnNjcmliaW5nIHRoaXMgZmlsdGVyIGV4ZWN1dGVzIGEgbXF0dCB1bnN1YnNjcmliZS5cclxuICAgKi9cclxuICBwdWJsaWMgb2JzZXJ2ZShmaWx0ZXJTdHJpbmc6IHN0cmluZywgb3B0czogSUNsaWVudFN1YnNjcmliZU9wdGlvbnMgPSB7cW9zOiAxfSk6IE9ic2VydmFibGU8SU1xdHRNZXNzYWdlPiB7XHJcbiAgICByZXR1cm4gdGhpcy5fZ2VuZXJhbE9ic2VydmUoZmlsdGVyU3RyaW5nLCAoKSA9PiBwdWJsaXNoKCksIG9wdHMpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogV2l0aCB0aGlzIG1ldGhvZCwgeW91IGNhbiBvYnNlcnZlIG1lc3NhZ2VzIGZvciBhIG1xdHQgdG9waWMuXHJcbiAgICogVGhlIG9ic2VydmFibGUgd2lsbCBvbmx5IGVtaXQgbWVzc2FnZXMgbWF0Y2hpbmcgdGhlIGZpbHRlci5cclxuICAgKiBUaGUgZmlyc3Qgb25lIHN1YnNjcmliaW5nIHRvIHRoZSByZXN1bHRpbmcgb2JzZXJ2YWJsZSBleGVjdXRlcyBhIG1xdHQgc3Vic2NyaWJlLlxyXG4gICAqIFRoZSBsYXN0IG9uZSB1bnN1YnNjcmliaW5nIHRoaXMgZmlsdGVyIGV4ZWN1dGVzIGEgbXF0dCB1bnN1YnNjcmliZS5cclxuICAgKiBEZXBlbmRpbmcgb24gdGhlIHB1Ymxpc2ggZnVuY3Rpb24sIHRoZSBtZXNzYWdlcyB3aWxsIGVpdGhlciBiZSByZXBsYXllZCBhZnRlciBuZXdcclxuICAgKiBzdWJzY3JpYmVycyBzdWJzY3JpYmUgb3IgdGhlIG1lc3NhZ2VzIGFyZSBqdXN0IHBhc3NlZCB0aHJvdWdoXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBfZ2VuZXJhbE9ic2VydmUoZmlsdGVyU3RyaW5nOiBzdHJpbmcsIHB1Ymxpc2hGbjogRnVuY3Rpb24sIG9wdHM6IElDbGllbnRTdWJzY3JpYmVPcHRpb25zKTogT2JzZXJ2YWJsZTxJTXF0dE1lc3NhZ2U+IHtcclxuICAgIGlmICghdGhpcy5jbGllbnQpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdtcXR0IGNsaWVudCBub3QgY29ubmVjdGVkJyk7XHJcbiAgICB9XHJcbiAgICBpZiAoIXRoaXMub2JzZXJ2YWJsZXNbZmlsdGVyU3RyaW5nXSkge1xyXG4gICAgICBjb25zdCByZWplY3RlZDogU3ViamVjdDxJTXF0dE1lc3NhZ2U+ID0gbmV3IFN1YmplY3QoKTtcclxuICAgICAgdGhpcy5vYnNlcnZhYmxlc1tmaWx0ZXJTdHJpbmddID0gdXNpbmcoXHJcbiAgICAgICAgLy8gcmVzb3VyY2VGYWN0b3J5OiBEbyB0aGUgYWN0dWFsIHJlZi1jb3VudGluZyBNUVRUIHN1YnNjcmlwdGlvbi5cclxuICAgICAgICAvLyByZWZjb3VudCBpcyBkZWNyZWFzZWQgb24gdW5zdWJzY3JpYmUuXHJcbiAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgY29uc3Qgc3Vic2NyaXB0aW9uOiBTdWJzY3JpcHRpb24gPSBuZXcgU3Vic2NyaXB0aW9uKCk7XHJcbiAgICAgICAgICB0aGlzLmNsaWVudC5zdWJzY3JpYmUoZmlsdGVyU3RyaW5nLCBvcHRzLCAoZXJyLCBncmFudGVkOiBJU3Vic2NyaXB0aW9uR3JhbnRbXSkgPT4ge1xyXG4gICAgICAgICAgICBpZiAoZ3JhbnRlZCkgeyAvLyBncmFudGVkIGNhbiBiZSB1bmRlZmluZWQgd2hlbiBhbiBlcnJvciBvY2N1cnMgd2hlbiB0aGUgY2xpZW50IGlzIGRpc2Nvbm5lY3RpbmdcclxuICAgICAgICAgICAgICBncmFudGVkLmZvckVhY2goKGdyYW50ZWRfOiBJU3Vic2NyaXB0aW9uR3JhbnQpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChncmFudGVkXy5xb3MgPT09IDEyOCkge1xyXG4gICAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5vYnNlcnZhYmxlc1tncmFudGVkXy50b3BpY107XHJcbiAgICAgICAgICAgICAgICAgIHRoaXMuY2xpZW50LnVuc3Vic2NyaWJlKGdyYW50ZWRfLnRvcGljKTtcclxuICAgICAgICAgICAgICAgICAgcmVqZWN0ZWQuZXJyb3IoYHN1YnNjcmlwdGlvbiBmb3IgJyR7Z3JhbnRlZF8udG9waWN9JyByZWplY3RlZCFgKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMuX29uU3ViYWNrLmVtaXQoe2ZpbHRlcjogZmlsdGVyU3RyaW5nLCBncmFudGVkOiBncmFudGVkXy5xb3MgIT09IDEyOH0pO1xyXG4gICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICAgIHN1YnNjcmlwdGlvbi5hZGQoKCkgPT4ge1xyXG4gICAgICAgICAgICBkZWxldGUgdGhpcy5vYnNlcnZhYmxlc1tmaWx0ZXJTdHJpbmddO1xyXG4gICAgICAgICAgICB0aGlzLmNsaWVudC51bnN1YnNjcmliZShmaWx0ZXJTdHJpbmcpO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgICByZXR1cm4gc3Vic2NyaXB0aW9uO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgLy8gb2JzZXJ2YWJsZUZhY3Rvcnk6IENyZWF0ZSB0aGUgb2JzZXJ2YWJsZSB0aGF0IGlzIGNvbnN1bWVkIGZyb20uXHJcbiAgICAgICAgLy8gVGhpcyBwYXJ0IGlzIG5vdCBleGVjdXRlZCB1bnRpbCB0aGUgT2JzZXJ2YWJsZSByZXR1cm5lZCBieVxyXG4gICAgICAgIC8vIGBvYnNlcnZlYCBnZXRzIGFjdHVhbGx5IHN1YnNjcmliZWQuXHJcbiAgICAgICAgKHN1YnNjcmlwdGlvbjogVW5zdWJzY3JpYmFibGUgfCB2b2lkKSA9PiBtZXJnZShyZWplY3RlZCwgdGhpcy5tZXNzYWdlcykpXHJcbiAgICAgICAgLnBpcGUoXHJcbiAgICAgICAgICBmaWx0ZXIoKG1zZzogSU1xdHRNZXNzYWdlKSA9PiBNcXR0U2VydmljZS5maWx0ZXJNYXRjaGVzVG9waWMoZmlsdGVyU3RyaW5nLCBtc2cudG9waWMpKSxcclxuICAgICAgICAgIHB1Ymxpc2hGbigpLFxyXG4gICAgICAgICAgcmVmQ291bnQoKVxyXG4gICAgICAgICkgYXMgT2JzZXJ2YWJsZTxJTXF0dE1lc3NhZ2U+O1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXMub2JzZXJ2YWJsZXNbZmlsdGVyU3RyaW5nXTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoaXMgbWV0aG9kIHJldHVybnMgYW4gb2JzZXJ2YWJsZSBmb3IgYSB0b3BpYyB3aXRoIG9wdGlvbmFsIG9wdGlvbnMuXHJcbiAgICogQWZ0ZXIgc3Vic2NyaWJpbmcsIHRoZSBhY3R1YWwgbXF0dCBwdWJsaWNhdGlvbiB3aWxsIGJlIGV4ZWN1dGVkIGFuZFxyXG4gICAqIHRoZSBvYnNlcnZhYmxlIHdpbGwgZW1pdCBhbiBlbXB0eSB2YWx1ZSBhbmQgY29tcGxldGVzLCBpZiBwdWJsaXNoaW5nIHdhcyBzdWNjZXNzZnVsXHJcbiAgICogb3IgdGhyb3dzIGFuIGVycm9yLCBpZiB0aGUgcHVibGljYXRpb24gZmFpbHMuXHJcbiAgICovXHJcbiAgcHVibGljIHB1Ymxpc2godG9waWM6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nIHwgQnVmZmVyLCBvcHRpb25zPzogSVB1Ymxpc2hPcHRpb25zKTogT2JzZXJ2YWJsZTx2b2lkPiB7XHJcbiAgICBpZiAoIXRoaXMuY2xpZW50KSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignbXF0dCBjbGllbnQgbm90IGNvbm5lY3RlZCcpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIE9ic2VydmFibGUuY3JlYXRlKChvYnM6IE9ic2VydmVyPHZvaWQ+KSA9PiB7XHJcbiAgICAgIHRoaXMuY2xpZW50LnB1Ymxpc2godG9waWMsIG1lc3NhZ2UsIG9wdGlvbnMsIChlcnI6IEVycm9yKSA9PiB7XHJcbiAgICAgICAgaWYgKGVycikge1xyXG4gICAgICAgICAgb2JzLmVycm9yKGVycik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIG9icy5uZXh0KG51bGwpO1xyXG4gICAgICAgICAgb2JzLmNvbXBsZXRlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVGhpcyBtZXRob2QgcHVibGlzaGVzIGEgbWVzc2FnZSBmb3IgYSB0b3BpYyB3aXRoIG9wdGlvbmFsIG9wdGlvbnMuXHJcbiAgICogSWYgYW4gZXJyb3Igb2NjdXJzLCBpdCB3aWxsIHRocm93LlxyXG4gICAqL1xyXG4gIHB1YmxpYyB1bnNhZmVQdWJsaXNoKHRvcGljOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZyB8IEJ1ZmZlciwgb3B0aW9ucz86IElQdWJsaXNoT3B0aW9ucyk6IHZvaWQge1xyXG4gICAgaWYgKCF0aGlzLmNsaWVudCkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ21xdHQgY2xpZW50IG5vdCBjb25uZWN0ZWQnKTtcclxuICAgIH1cclxuICAgIHRoaXMuY2xpZW50LnB1Ymxpc2godG9waWMsIG1lc3NhZ2UsIG9wdGlvbnMsIChlcnI6IEVycm9yKSA9PiB7XHJcbiAgICAgIGlmIChlcnIpIHtcclxuICAgICAgICB0aHJvdyAoZXJyKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIF9oYW5kbGVPbkNvbm5lY3QgPSAoZTogSU9uQ29ubmVjdEV2ZW50KSA9PiB7XHJcbiAgICBpZiAodGhpcy5vcHRpb25zLmNvbm5lY3RPbkNyZWF0ZSA9PT0gdHJ1ZSkge1xyXG4gICAgICBPYmplY3Qua2V5cyh0aGlzLm9ic2VydmFibGVzKS5mb3JFYWNoKChmaWx0ZXJTdHJpbmc6IHN0cmluZykgPT4ge1xyXG4gICAgICAgIHRoaXMuY2xpZW50LnN1YnNjcmliZShmaWx0ZXJTdHJpbmcpO1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuICAgIHRoaXMuc3RhdGUubmV4dChNcXR0Q29ubmVjdGlvblN0YXRlLkNPTk5FQ1RFRCk7XHJcbiAgICB0aGlzLl9vbkNvbm5lY3QuZW1pdChlKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgX2hhbmRsZU9uUmVjb25uZWN0ID0gKCkgPT4ge1xyXG4gICAgaWYgKHRoaXMub3B0aW9ucy5jb25uZWN0T25DcmVhdGUgPT09IHRydWUpIHtcclxuICAgICAgT2JqZWN0LmtleXModGhpcy5vYnNlcnZhYmxlcykuZm9yRWFjaCgoZmlsdGVyU3RyaW5nOiBzdHJpbmcpID0+IHtcclxuICAgICAgICB0aGlzLmNsaWVudC5zdWJzY3JpYmUoZmlsdGVyU3RyaW5nKTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICB0aGlzLnN0YXRlLm5leHQoTXF0dENvbm5lY3Rpb25TdGF0ZS5DT05ORUNUSU5HKTtcclxuICAgIHRoaXMuX29uUmVjb25uZWN0LmVtaXQoKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgX2hhbmRsZU9uQ2xvc2UgPSAoKSA9PiB7XHJcbiAgICB0aGlzLnN0YXRlLm5leHQoTXF0dENvbm5lY3Rpb25TdGF0ZS5DTE9TRUQpO1xyXG4gICAgdGhpcy5fb25DbG9zZS5lbWl0KCk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIF9oYW5kbGVPbk9mZmxpbmUgPSAoKSA9PiB7XHJcbiAgICB0aGlzLl9vbk9mZmxpbmUuZW1pdCgpO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBfaGFuZGxlT25FcnJvciA9IChlOiBJT25FcnJvckV2ZW50KSA9PiB7XHJcbiAgICB0aGlzLl9vbkVycm9yLmVtaXQoZSk7XHJcbiAgICBjb25zb2xlLmVycm9yKGUpO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBfaGFuZGxlT25FbmQgPSAoKSA9PiB7XHJcbiAgICB0aGlzLl9vbkVuZC5lbWl0KCk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIF9oYW5kbGVPbk1lc3NhZ2UgPSAodG9waWM6IHN0cmluZywgbXNnLCBwYWNrZXQ6IElNcXR0TWVzc2FnZSkgPT4ge1xyXG4gICAgdGhpcy5fb25NZXNzYWdlLmVtaXQocGFja2V0KTtcclxuICAgIGlmIChwYWNrZXQuY21kID09PSAncHVibGlzaCcpIHtcclxuICAgICAgdGhpcy5tZXNzYWdlcy5uZXh0KHBhY2tldCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIF9oYW5kbGVPblBhY2tldHNlbmQgPSAoZTogSU9uUGFja2V0c2VuZEV2ZW50KSA9PiB7XHJcbiAgICB0aGlzLl9vblBhY2tldHNlbmQuZW1pdCgpO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBfaGFuZGxlT25QYWNrZXRyZWNlaXZlID0gKGU6IElPblBhY2tldHJlY2VpdmVFdmVudCkgPT4ge1xyXG4gICAgdGhpcy5fb25QYWNrZXRyZWNlaXZlLmVtaXQoKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgX2dlbmVyYXRlQ2xpZW50SWQoKSB7XHJcbiAgICByZXR1cm4gJ2NsaWVudC0nICsgTWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc3Vic3RyKDIsIDE5KTtcclxuICB9XHJcbn1cclxuIl19