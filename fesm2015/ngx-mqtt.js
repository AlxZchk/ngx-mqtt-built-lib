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

var MqttModule_1;
const MQTT_SERVICE_OPTIONS = {
    connectOnCreate: true,
    hostname: 'localhost',
    port: 1884,
    path: ''
};
const MqttServiceConfig = new InjectionToken('NgxMqttServiceConfig');
const MqttClientService = new InjectionToken('NgxMqttClientService');
let MqttModule = MqttModule_1 = class MqttModule {
    static forRoot(config, client) {
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
    }
};
MqttModule = MqttModule_1 = __decorate([
    NgModule()
], MqttModule);

var MqttService_1;
/**
 * With an instance of MqttService, you can observe and subscribe to MQTT in multiple places, e.g. in different components,
 * to only subscribe to the broker once per MQTT filter.
 * It also handles proper unsubscription from the broker, if the last observable with a filter is closed.
 */
let MqttService = MqttService_1 = class MqttService {
    /**
     * The constructor needs [connection options]{@link IMqttServiceOptions} regarding the broker and some
     * options to configure behavior of this service, like if the connection to the broker
     * should be established on creation of this service or not.
     */
    constructor(options, client) {
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
        this._handleOnConnect = (e) => {
            if (this.options.connectOnCreate === true) {
                Object.keys(this.observables).forEach((filterString) => {
                    this.client.subscribe(filterString);
                });
            }
            this.state.next(MqttConnectionState.CONNECTED);
            this._onConnect.emit(e);
        };
        this._handleOnReconnect = () => {
            if (this.options.connectOnCreate === true) {
                Object.keys(this.observables).forEach((filterString) => {
                    this.client.subscribe(filterString);
                });
            }
            this.state.next(MqttConnectionState.CONNECTING);
            this._onReconnect.emit();
        };
        this._handleOnClose = () => {
            this.state.next(MqttConnectionState.CLOSED);
            this._onClose.emit();
        };
        this._handleOnOffline = () => {
            this._onOffline.emit();
        };
        this._handleOnError = (e) => {
            this._onError.emit(e);
            console.error(e);
        };
        this._handleOnEnd = () => {
            this._onEnd.emit();
        };
        this._handleOnMessage = (topic, msg, packet) => {
            this._onMessage.emit(packet);
            if (packet.cmd === 'publish') {
                this.messages.next(packet);
            }
        };
        this._handleOnPacketsend = (e) => {
            this._onPacketsend.emit();
        };
        this._handleOnPacketreceive = (e) => {
            this._onPacketreceive.emit();
        };
        if (options.connectOnCreate !== false) {
            this.connect({}, client);
        }
        this.state.subscribe();
    }
    /**
     * gets the _clientId
     */
    get clientId() {
        return this._clientId;
    }
    /** An EventEmitter to listen to connect messages */
    get onConnect() {
        return this._onConnect;
    }
    /** An EventEmitter to listen to reconnect messages */
    get onReconnect() {
        return this._onReconnect;
    }
    /** An EventEmitter to listen to close messages */
    get onClose() {
        return this._onClose;
    }
    /** An EventEmitter to listen to offline events */
    get onOffline() {
        return this._onOffline;
    }
    /** An EventEmitter to listen to error events */
    get onError() {
        return this._onError;
    }
    /** An EventEmitter to listen to close messages */
    get onEnd() {
        return this._onEnd;
    }
    /** An EventEmitter to listen to message events */
    get onMessage() {
        return this._onMessage;
    }
    /** An EventEmitter to listen to packetsend messages */
    get onPacketsend() {
        return this._onPacketsend;
    }
    /** An EventEmitter to listen to packetreceive messages */
    get onPacketreceive() {
        return this._onPacketreceive;
    }
    /** An EventEmitter to listen to suback events */
    get onSuback() {
        return this._onSuback;
    }
    /**
     * This static method shall be used to determine whether a MQTT
     * topic matches a given filter. The matching rules are specified in the MQTT
     * standard documentation and in the library test suite.
     *
     * @param  {string}  filter A filter may contain wildcards like '#' and '+'.
     * @param  {string}  topic  A topic may not contain wildcards.
     * @return {boolean}        true on match and false otherwise.
     */
    static filterMatchesTopic(filterString, topic) {
        if (filterString[0] === '#' && topic[0] === '$') {
            return false;
        }
        // Preparation: split and reverse on '/'. The JavaScript split function is sane.
        const fs = (filterString || '').split('/').reverse();
        const ts = (topic || '').split('/').reverse();
        // This function is tail recursive and compares both arrays one element at a time.
        const match = () => {
            // Cutting of the last element of both the filter and the topic using pop().
            const f = fs.pop();
            const t = ts.pop();
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
    }
    /**
     * connect manually connects to the mqtt broker.
     */
    connect(opts, client) {
        const options = extend(this.options || {}, opts);
        const protocol = options.protocol || 'ws';
        const hostname = options.hostname || 'localhost';
        if (options.url) {
            this._url = options.url;
        }
        else {
            this._url = `${protocol}://${hostname}`;
            this._url += options.port ? `:${options.port}` : '';
            this._url += options.path ? `${options.path}` : '';
        }
        this.state.next(MqttConnectionState.CONNECTING);
        const mergedOptions = extend({
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
    }
    /**
     * disconnect disconnects from the mqtt client.
     * This method `should` be executed when leaving the application.
     */
    disconnect(force = true) {
        if (!this.client) {
            throw new Error('mqtt client not connected');
        }
        this.client.end(force);
    }
    /**
     * With this method, you can observe messages for a mqtt topic.
     * The observable will only emit messages matching the filter.
     * The first one subscribing to the resulting observable executes a mqtt subscribe.
     * The last one unsubscribing this filter executes a mqtt unsubscribe.
     * Every new subscriber gets the latest message.
     */
    observeRetained(filterString, opts = { qos: 1 }) {
        return this._generalObserve(filterString, () => publishReplay(1), opts);
    }
    /**
     * With this method, you can observe messages for a mqtt topic.
     * The observable will only emit messages matching the filter.
     * The first one subscribing to the resulting observable executes a mqtt subscribe.
     * The last one unsubscribing this filter executes a mqtt unsubscribe.
     */
    observe(filterString, opts = { qos: 1 }) {
        return this._generalObserve(filterString, () => publish(), opts);
    }
    /**
     * With this method, you can observe messages for a mqtt topic.
     * The observable will only emit messages matching the filter.
     * The first one subscribing to the resulting observable executes a mqtt subscribe.
     * The last one unsubscribing this filter executes a mqtt unsubscribe.
     * Depending on the publish function, the messages will either be replayed after new
     * subscribers subscribe or the messages are just passed through
     */
    _generalObserve(filterString, publishFn, opts) {
        if (!this.client) {
            throw new Error('mqtt client not connected');
        }
        if (!this.observables[filterString]) {
            const rejected = new Subject();
            this.observables[filterString] = using(
            // resourceFactory: Do the actual ref-counting MQTT subscription.
            // refcount is decreased on unsubscribe.
            () => {
                const subscription = new Subscription();
                this.client.subscribe(filterString, opts, (err, granted) => {
                    if (granted) { // granted can be undefined when an error occurs when the client is disconnecting
                        granted.forEach((granted_) => {
                            if (granted_.qos === 128) {
                                delete this.observables[granted_.topic];
                                this.client.unsubscribe(granted_.topic);
                                rejected.error(`subscription for '${granted_.topic}' rejected!`);
                            }
                            this._onSuback.emit({ filter: filterString, granted: granted_.qos !== 128 });
                        });
                    }
                });
                subscription.add(() => {
                    delete this.observables[filterString];
                    this.client.unsubscribe(filterString);
                });
                return subscription;
            }, 
            // observableFactory: Create the observable that is consumed from.
            // This part is not executed until the Observable returned by
            // `observe` gets actually subscribed.
            (subscription) => merge(rejected, this.messages))
                .pipe(filter((msg) => MqttService_1.filterMatchesTopic(filterString, msg.topic)), publishFn(), refCount());
        }
        return this.observables[filterString];
    }
    /**
     * This method returns an observable for a topic with optional options.
     * After subscribing, the actual mqtt publication will be executed and
     * the observable will emit an empty value and completes, if publishing was successful
     * or throws an error, if the publication fails.
     */
    publish(topic, message, options) {
        if (!this.client) {
            throw new Error('mqtt client not connected');
        }
        return Observable.create((obs) => {
            this.client.publish(topic, message, options, (err) => {
                if (err) {
                    obs.error(err);
                }
                else {
                    obs.next(null);
                    obs.complete();
                }
            });
        });
    }
    /**
     * This method publishes a message for a topic with optional options.
     * If an error occurs, it will throw.
     */
    unsafePublish(topic, message, options) {
        if (!this.client) {
            throw new Error('mqtt client not connected');
        }
        this.client.publish(topic, message, options, (err) => {
            if (err) {
                throw (err);
            }
        });
    }
    _generateClientId() {
        return 'client-' + Math.random().toString(36).substr(2, 19);
    }
};
MqttService.ctorParameters = () => [
    { type: undefined, decorators: [{ type: Inject, args: [MqttServiceConfig,] }] },
    { type: undefined, decorators: [{ type: Inject, args: [MqttClientService,] }] }
];
MqttService.ɵprov = ɵɵdefineInjectable({ factory: function MqttService_Factory() { return new MqttService(ɵɵinject(MqttServiceConfig), ɵɵinject(MqttClientService)); }, token: MqttService, providedIn: "root" });
MqttService = MqttService_1 = __decorate([
    Injectable({
        providedIn: 'root',
    }),
    __param(0, Inject(MqttServiceConfig)),
    __param(1, Inject(MqttClientService))
], MqttService);

/*
 * Public API Surface of ngx-mqtt
 */

/**
 * Generated bundle index. Do not edit.
 */

export { MQTT_SERVICE_OPTIONS, MqttClientService, MqttConnectionState, MqttModule, MqttService, MqttServiceConfig };
//# sourceMappingURL=ngx-mqtt.js.map
