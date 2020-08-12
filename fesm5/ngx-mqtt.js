import { __decorate, __param } from 'tslib';
import { InjectionToken, NgModule, EventEmitter, Inject, ɵɵdefineInjectable, ɵɵinject, Injectable } from '@angular/core';
import { connect } from 'mqtt';
import * as extend from 'xtend';
import { BehaviorSubject, Subject, using, Subscription, merge, Observable } from 'rxjs';
import { publishReplay, publish, filter, refCount } from 'rxjs/operators';

var MqttConnectionState;
(function (MqttConnectionState) {
    MqttConnectionState[MqttConnectionState["CLOSED"] = 0] = "CLOSED";
    MqttConnectionState[MqttConnectionState["CONNECTING"] = 1] = "CONNECTING";
    MqttConnectionState[MqttConnectionState["CONNECTED"] = 2] = "CONNECTED";
})(MqttConnectionState || (MqttConnectionState = {}));

var MQTT_SERVICE_OPTIONS = {
    connectOnCreate: true,
    hostname: 'localhost',
    port: 1884,
    path: ''
};
var MqttServiceConfig = new InjectionToken('NgxMqttServiceConfig');
var MqttClientService = new InjectionToken('NgxMqttClientService');
var MqttModule = /** @class */ (function () {
    function MqttModule() {
    }
    MqttModule_1 = MqttModule;
    MqttModule.forRoot = function (config, client) {
        return {
            ngModule: MqttModule_1,
            providers: [
                {
                    provide: MqttServiceConfig,
                    useValue: config
                },
                {
                    provide: MqttClientService,
                    useValue: client
                }
            ]
        };
    };
    var MqttModule_1;
    MqttModule = MqttModule_1 = __decorate([
        NgModule()
    ], MqttModule);
    return MqttModule;
}());

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
    MqttService.ɵprov = ɵɵdefineInjectable({ factory: function MqttService_Factory() { return new MqttService(ɵɵinject(MqttServiceConfig), ɵɵinject(MqttClientService)); }, token: MqttService, providedIn: "root" });
    MqttService = MqttService_1 = __decorate([
        Injectable({
            providedIn: 'root',
        }),
        __param(0, Inject(MqttServiceConfig)),
        __param(1, Inject(MqttClientService))
    ], MqttService);
    return MqttService;
}());

/*
 * Public API Surface of ngx-mqtt
 */

/**
 * Generated bundle index. Do not edit.
 */

export { MQTT_SERVICE_OPTIONS, MqttClientService, MqttConnectionState, MqttModule, MqttService, MqttServiceConfig };
//# sourceMappingURL=ngx-mqtt.js.map
