(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@angular/core'), require('mqtt'), require('xtend'), require('rxjs'), require('rxjs/operators')) :
    typeof define === 'function' && define.amd ? define('ngx-mqtt', ['exports', '@angular/core', 'mqtt', 'xtend', 'rxjs', 'rxjs/operators'], factory) :
    (global = global || self, factory(global['ngx-mqtt'] = {}, global.ng.core, global.mqtt, global.extend, global.rxjs, global.rxjs.operators));
}(this, (function (exports, core, mqtt, extend, rxjs, operators) { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    function __rest(s, e) {
        var t = {};
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
        if (s != null && typeof Object.getOwnPropertySymbols === "function")
            for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
                if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                    t[p[i]] = s[p[i]];
            }
        return t;
    }

    function __decorate(decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    }

    function __param(paramIndex, decorator) {
        return function (target, key) { decorator(target, key, paramIndex); }
    }

    function __metadata(metadataKey, metadataValue) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
    }

    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    function __generator(thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    }

    function __createBinding(o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
    }

    function __exportStar(m, exports) {
        for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) exports[p] = m[p];
    }

    function __values(o) {
        var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
        if (m) return m.call(o);
        if (o && typeof o.length === "number") return {
            next: function () {
                if (o && i >= o.length) o = void 0;
                return { value: o && o[i++], done: !o };
            }
        };
        throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
    }

    function __read(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    }

    function __spread() {
        for (var ar = [], i = 0; i < arguments.length; i++)
            ar = ar.concat(__read(arguments[i]));
        return ar;
    }

    function __spreadArrays() {
        for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
        for (var r = Array(s), k = 0, i = 0; i < il; i++)
            for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
                r[k] = a[j];
        return r;
    };

    function __await(v) {
        return this instanceof __await ? (this.v = v, this) : new __await(v);
    }

    function __asyncGenerator(thisArg, _arguments, generator) {
        if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
        var g = generator.apply(thisArg, _arguments || []), i, q = [];
        return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
        function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
        function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
        function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
        function fulfill(value) { resume("next", value); }
        function reject(value) { resume("throw", value); }
        function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
    }

    function __asyncDelegator(o) {
        var i, p;
        return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
        function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v; } : f; }
    }

    function __asyncValues(o) {
        if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
        var m = o[Symbol.asyncIterator], i;
        return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
        function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
        function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
    }

    function __makeTemplateObject(cooked, raw) {
        if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
        return cooked;
    };

    function __importStar(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
        result.default = mod;
        return result;
    }

    function __importDefault(mod) {
        return (mod && mod.__esModule) ? mod : { default: mod };
    }

    function __classPrivateFieldGet(receiver, privateMap) {
        if (!privateMap.has(receiver)) {
            throw new TypeError("attempted to get private field on non-instance");
        }
        return privateMap.get(receiver);
    }

    function __classPrivateFieldSet(receiver, privateMap, value) {
        if (!privateMap.has(receiver)) {
            throw new TypeError("attempted to set private field on non-instance");
        }
        privateMap.set(receiver, value);
        return value;
    }

    (function (MqttConnectionState) {
        MqttConnectionState[MqttConnectionState["CLOSED"] = 0] = "CLOSED";
        MqttConnectionState[MqttConnectionState["CONNECTING"] = 1] = "CONNECTING";
        MqttConnectionState[MqttConnectionState["CONNECTED"] = 2] = "CONNECTED";
    })(exports.MqttConnectionState || (exports.MqttConnectionState = {}));

    var MQTT_SERVICE_OPTIONS = {
        connectOnCreate: true,
        hostname: 'localhost',
        port: 1884,
        path: ''
    };
    var MqttServiceConfig = new core.InjectionToken('NgxMqttServiceConfig');
    var MqttClientService = new core.InjectionToken('NgxMqttClientService');
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
            core.NgModule()
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
            this.state = new rxjs.BehaviorSubject(exports.MqttConnectionState.CLOSED);
            /** an observable of the last mqtt message */
            this.messages = new rxjs.Subject();
            this._clientId = this._generateClientId();
            this._connectTimeout = 10000;
            this._reconnectPeriod = 10000;
            this._url = undefined;
            this._onConnect = new core.EventEmitter();
            this._onReconnect = new core.EventEmitter();
            this._onClose = new core.EventEmitter();
            this._onOffline = new core.EventEmitter();
            this._onError = new core.EventEmitter();
            this._onEnd = new core.EventEmitter();
            this._onMessage = new core.EventEmitter();
            this._onSuback = new core.EventEmitter();
            this._onPacketsend = new core.EventEmitter();
            this._onPacketreceive = new core.EventEmitter();
            this._handleOnConnect = function (e) {
                if (_this.options.connectOnCreate === true) {
                    Object.keys(_this.observables).forEach(function (filterString) {
                        _this.client.subscribe(filterString);
                    });
                }
                _this.state.next(exports.MqttConnectionState.CONNECTED);
                _this._onConnect.emit(e);
            };
            this._handleOnReconnect = function () {
                if (_this.options.connectOnCreate === true) {
                    Object.keys(_this.observables).forEach(function (filterString) {
                        _this.client.subscribe(filterString);
                    });
                }
                _this.state.next(exports.MqttConnectionState.CONNECTING);
                _this._onReconnect.emit();
            };
            this._handleOnClose = function () {
                _this.state.next(exports.MqttConnectionState.CLOSED);
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
            this.state.next(exports.MqttConnectionState.CONNECTING);
            var mergedOptions = extend({
                clientId: this._clientId,
                reconnectPeriod: this._reconnectPeriod,
                connectTimeout: this._connectTimeout
            }, options);
            if (this.client) {
                this.client.end(true);
            }
            if (!client) {
                this.client = mqtt.connect(this._url, mergedOptions);
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
            return this._generalObserve(filterString, function () { return operators.publishReplay(1); }, opts);
        };
        /**
         * With this method, you can observe messages for a mqtt topic.
         * The observable will only emit messages matching the filter.
         * The first one subscribing to the resulting observable executes a mqtt subscribe.
         * The last one unsubscribing this filter executes a mqtt unsubscribe.
         */
        MqttService.prototype.observe = function (filterString, opts) {
            if (opts === void 0) { opts = { qos: 1 }; }
            return this._generalObserve(filterString, function () { return operators.publish(); }, opts);
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
                var rejected_1 = new rxjs.Subject();
                this.observables[filterString] = rxjs.using(
                // resourceFactory: Do the actual ref-counting MQTT subscription.
                // refcount is decreased on unsubscribe.
                function () {
                    var subscription = new rxjs.Subscription();
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
                function (subscription) { return rxjs.merge(rejected_1, _this.messages); })
                    .pipe(operators.filter(function (msg) { return MqttService_1.filterMatchesTopic(filterString, msg.topic); }), publishFn(), operators.refCount());
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
            return rxjs.Observable.create(function (obs) {
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
            { type: undefined, decorators: [{ type: core.Inject, args: [MqttServiceConfig,] }] },
            { type: undefined, decorators: [{ type: core.Inject, args: [MqttClientService,] }] }
        ]; };
        MqttService.ɵprov = core.ɵɵdefineInjectable({ factory: function MqttService_Factory() { return new MqttService(core.ɵɵinject(MqttServiceConfig), core.ɵɵinject(MqttClientService)); }, token: MqttService, providedIn: "root" });
        MqttService = MqttService_1 = __decorate([
            core.Injectable({
                providedIn: 'root',
            }),
            __param(0, core.Inject(MqttServiceConfig)),
            __param(1, core.Inject(MqttClientService))
        ], MqttService);
        return MqttService;
    }());

    exports.MQTT_SERVICE_OPTIONS = MQTT_SERVICE_OPTIONS;
    exports.MqttClientService = MqttClientService;
    exports.MqttModule = MqttModule;
    exports.MqttService = MqttService;
    exports.MqttServiceConfig = MqttServiceConfig;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=ngx-mqtt.umd.js.map
