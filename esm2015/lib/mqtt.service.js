var MqttService_1;
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
MqttService.ɵprov = i0.ɵɵdefineInjectable({ factory: function MqttService_Factory() { return new MqttService(i0.ɵɵinject(i1.MqttServiceConfig), i0.ɵɵinject(i1.MqttClientService)); }, token: MqttService, providedIn: "root" });
MqttService = MqttService_1 = __decorate([
    Injectable({
        providedIn: 'root',
    }),
    __param(0, Inject(MqttServiceConfig)),
    __param(1, Inject(MqttClientService))
], MqttService);
export { MqttService };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXF0dC5zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6Im5nOi8vbmd4LW1xdHQvIiwic291cmNlcyI6WyJsaWIvbXF0dC5zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsT0FBTyxFQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQy9ELE9BQU8sRUFBQyxPQUFPLEVBQThDLE1BQU0sTUFBTSxDQUFDO0FBQzFFLE9BQU8sS0FBSyxNQUFNLE1BQU0sT0FBTyxDQUFDO0FBRWhDLE9BQU8sRUFBQyxlQUFlLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBWSxPQUFPLEVBQUUsWUFBWSxFQUFrQixLQUFLLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDaEgsT0FBTyxFQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsYUFBYSxFQUFFLFFBQVEsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRXhFLE9BQU8sRUFXTCxtQkFBbUIsRUFDcEIsTUFBTSxjQUFjLENBQUM7QUFFdEIsT0FBTyxFQUFDLGlCQUFpQixFQUFFLGlCQUFpQixFQUFDLE1BQU0sZUFBZSxDQUFDOzs7QUFFbkU7Ozs7R0FJRztBQUlILElBQWEsV0FBVyxtQkFBeEIsTUFBYSxXQUFXO0lBRXRCOzs7O09BSUc7SUFDSCxZQUNxQyxPQUE0QixFQUM1QixNQUFvQjtRQURwQixZQUFPLEdBQVAsT0FBTyxDQUFxQjtRQUM1QixXQUFNLEdBQU4sTUFBTSxDQUFjO1FBaUV6RCw4Q0FBOEM7UUFDdkMsZ0JBQVcsR0FBeUQsRUFBRSxDQUFDO1FBQzlFLDJCQUEyQjtRQUNwQixVQUFLLEdBQXlDLElBQUksZUFBZSxDQUFDLG1CQUFtQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3JHLDZDQUE2QztRQUN0QyxhQUFRLEdBQTBCLElBQUksT0FBTyxFQUFnQixDQUFDO1FBRTdELGNBQVMsR0FBRyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUNyQyxvQkFBZSxHQUFHLEtB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QUFDO2lCQUNoQjtZQUNILENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQ7OztPQUdHO0lBQ0ksYUFBYSxDQUFDLEtBQWEsRUFBRSxPQUF3QixFQUFFLE9BQXlCO1FBQ3JGLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ2hCLE1BQU0sSUFBSSxLQUFLLENBQUMsMkJBQTJCLENBQUMsQ0FBQztTQUM5QztRQUNELElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLENBQUMsR0FBVSxFQUFFLEVBQUU7WUFDMUQsSUFBSSxHQUFHLEVBQUU7Z0JBQ1AsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2FBQ2I7UUFDSCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUF1RE8saUJBQWlCO1FBQ3ZCLE9BQU8sU0FBUyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUM5RCxDQUFDO0NBQ0YsQ0FBQTs7NENBM1ZJLE1BQU0sU0FBQyxpQkFBaUI7NENBQ3hCLE1BQU0sU0FBQyxpQkFBaUI7OztBQVRoQixXQUFXO0lBSHZCLFVBQVUsQ0FBQztRQUNWLFVBQVUsRUFBRSxNQUFNO0tBQ25CLENBQUM7SUFTRyxXQUFBLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFBO0lBQ3pCLFdBQUEsTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUE7R0FUakIsV0FBVyxDQW1XdkI7U0FuV1ksV0FBVyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7RXZlbnRFbWl0dGVyLCBJbmplY3QsIEluamVjdGFibGV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xyXG5pbXBvcnQge2Nvbm5lY3QsIElDbGllbnRTdWJzY3JpYmVPcHRpb25zLCBJU3Vic2NyaXB0aW9uR3JhbnR9IGZyb20gJ21xdHQnO1xyXG5pbXBvcnQgKiBhcyBleHRlbmQgZnJvbSAneHRlbmQnO1xyXG5cclxuaW1wb3J0IHtCZWhhdmlvclN1YmplY3QsIG1lcmdlLCBPYnNlcnZhYmxlLCBPYnNlcnZlciwgU3ViamVjdCwgU3Vic2NyaXB0aW9uLCBVbnN1YnNjcmliYWJsZSwgdXNpbmd9IGZyb20gJ3J4anMnO1xyXG5pbXBvcnQge2ZpbHRlciwgcHVibGlzaCwgcHVibGlzaFJlcGxheSwgcmVmQ291bnR9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcclxuXHJcbmltcG9ydCB7XHJcbiAgSU1xdHRDbGllbnQsXHJcbiAgSU1xdHRNZXNzYWdlLFxyXG4gIElNcXR0U2VydmljZU9wdGlvbnMsXHJcbiAgSU9uQ29ubmVjdEV2ZW50LFxyXG4gIElPbkVycm9yRXZlbnQsXHJcbiAgSU9uTWVzc2FnZUV2ZW50LFxyXG4gIElPblBhY2tldHJlY2VpdmVFdmVudCxcclxuICBJT25QYWNrZXRzZW5kRXZlbnQsXHJcbiAgSU9uU3ViYWNrRXZlbnQsXHJcbiAgSVB1Ymxpc2hPcHRpb25zLFxyXG4gIE1xdHRDb25uZWN0aW9uU3RhdGVcclxufSBmcm9tICcuL21xdHQubW9kZWwnO1xyXG5cclxuaW1wb3J0IHtNcXR0Q2xpZW50U2VydmljZSwgTXF0dFNlcnZpY2VDb25maWd9IGZyb20gJy4vbXF0dC5tb2R1bGUnO1xyXG5cclxuLyoqXHJcbiAqIFdpdGggYW4gaW5zdGFuY2Ugb2YgTXF0dFNlcnZpY2UsIHlvdSBjYW4gb2JzZXJ2ZSBhbmQgc3Vic2NyaWJlIHRvIE1RVFQgaW4gbXVsdGlwbGUgcGxhY2VzLCBlLmcuIGluIGRpZmZlcmVudCBjb21wb25lbnRzLFxyXG4gKiB0byBvbmx5IHN1YnNjcmliZSB0byB0aGUgYnJva2VyIG9uY2UgcGVyIE1RVFQgZmlsdGVyLlxyXG4gKiBJdCBhbHNvIGhhbmRsZXMgcHJvcGVyIHVuc3Vic2NyaXB0aW9uIGZyb20gdGhlIGJyb2tlciwgaWYgdGhlIGxhc3Qgb2JzZXJ2YWJsZSB3aXRoIGEgZmlsdGVyIGlzIGNsb3NlZC5cclxuICovXHJcbkBJbmplY3RhYmxlKHtcclxuICBwcm92aWRlZEluOiAncm9vdCcsXHJcbn0pXHJcbmV4cG9ydCBjbGFzcyBNcXR0U2VydmljZSB7XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoZSBjb25zdHJ1Y3RvciBuZWVkcyBbY29ubmVjdGlvbiBvcHRpb25zXXtAbGluayBJTXF0dFNlcnZpY2VPcHRpb25zfSByZWdhcmRpbmcgdGhlIGJyb2tlciBhbmQgc29tZVxyXG4gICAqIG9wdGlvbnMgdG8gY29uZmlndXJlIGJlaGF2aW9yIG9mIHRoaXMgc2VydmljZSwgbGlrZSBpZiB0aGUgY29ubmVjdGlvbiB0byB0aGUgYnJva2VyXHJcbiAgICogc2hvdWxkIGJlIGVzdGFibGlzaGVkIG9uIGNyZWF0aW9uIG9mIHRoaXMgc2VydmljZSBvciBub3QuXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IoXHJcbiAgICBASW5qZWN0KE1xdHRTZXJ2aWNlQ29uZmlnKSBwcml2YXRlIG9wdGlvbnM6IElNcXR0U2VydmljZU9wdGlvbnMsXHJcbiAgICBASW5qZWN0KE1xdHRDbGllbnRTZXJ2aWNlKSBwcml2YXRlIGNsaWVudD86IElNcXR0Q2xpZW50XHJcbiAgKSB7XHJcbiAgICBpZiAob3B0aW9ucy5jb25uZWN0T25DcmVhdGUgIT09IGZhbHNlKSB7XHJcbiAgICAgIHRoaXMuY29ubmVjdCh7fSwgY2xpZW50KTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnN0YXRlLnN1YnNjcmliZSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogZ2V0cyB0aGUgX2NsaWVudElkXHJcbiAgICovXHJcbiAgcHVibGljIGdldCBjbGllbnRJZCgpIHtcclxuICAgIHJldHVybiB0aGlzLl9jbGllbnRJZDtcclxuICB9XHJcblxyXG4gIC8qKiBBbiBFdmVudEVtaXR0ZXIgdG8gbGlzdGVuIHRvIGNvbm5lY3QgbWVzc2FnZXMgKi9cclxuICBwdWJsaWMgZ2V0IG9uQ29ubmVjdCgpOiBFdmVudEVtaXR0ZXI8SU9uQ29ubmVjdEV2ZW50PiB7XHJcbiAgICByZXR1cm4gdGhpcy5fb25Db25uZWN0O1xyXG4gIH1cclxuXHJcbiAgLyoqIEFuIEV2ZW50RW1pdHRlciB0byBsaXN0ZW4gdG8gcmVjb25uZWN0IG1lc3NhZ2VzICovXHJcbiAgcHVibGljIGdldCBvblJlY29ubmVjdCgpOiBFdmVudEVtaXR0ZXI8dm9pZD4ge1xyXG4gICAgcmV0dXJuIHRoaXMuX29uUmVjb25uZWN0O1xyXG4gIH1cclxuXHJcbiAgLyoqIEFuIEV2ZW50RW1pdHRlciB0byBsaXN0ZW4gdG8gY2xvc2UgbWVzc2FnZXMgKi9cclxuICBwdWJsaWMgZ2V0IG9uQ2xvc2UoKTogRXZlbnRFbWl0dGVyPHZvaWQ+IHtcclxuICAgIHJldHVybiB0aGlzLl9vbkNsb3NlO1xyXG4gIH1cclxuXHJcbiAgLyoqIEFuIEV2ZW50RW1pdHRlciB0byBsaXN0ZW4gdG8gb2ZmbGluZSBldmVudHMgKi9cclxuICBwdWJsaWMgZ2V0IG9uT2ZmbGluZSgpOiBFdmVudEVtaXR0ZXI8dm9pZD4ge1xyXG4gICAgcmV0dXJuIHRoaXMuX29uT2ZmbGluZTtcclxuICB9XHJcblxyXG4gIC8qKiBBbiBFdmVudEVtaXR0ZXIgdG8gbGlzdGVuIHRvIGVycm9yIGV2ZW50cyAqL1xyXG4gIHB1YmxpYyBnZXQgb25FcnJvcigpOiBFdmVudEVtaXR0ZXI8SU9uRXJyb3JFdmVudD4ge1xyXG4gICAgcmV0dXJuIHRoaXMuX29uRXJyb3I7XHJcbiAgfVxyXG5cclxuICAvKiogQW4gRXZlbnRFbWl0dGVyIHRvIGxpc3RlbiB0byBjbG9zZSBtZXNzYWdlcyAqL1xyXG4gIHB1YmxpYyBnZXQgb25FbmQoKTogRXZlbnRFbWl0dGVyPHZvaWQ+IHtcclxuICAgIHJldHVybiB0aGlzLl9vbkVuZDtcclxuICB9XHJcblxyXG4gIC8qKiBBbiBFdmVudEVtaXR0ZXIgdG8gbGlzdGVuIHRvIG1lc3NhZ2UgZXZlbnRzICovXHJcbiAgcHVibGljIGdldCBvbk1lc3NhZ2UoKTogRXZlbnRFbWl0dGVyPElPbk1lc3NhZ2VFdmVudD4ge1xyXG4gICAgcmV0dXJuIHRoaXMuX29uTWVzc2FnZTtcclxuICB9XHJcblxyXG4gIC8qKiBBbiBFdmVudEVtaXR0ZXIgdG8gbGlzdGVuIHRvIHBhY2tldHNlbmQgbWVzc2FnZXMgKi9cclxuICBwdWJsaWMgZ2V0IG9uUGFja2V0c2VuZCgpOiBFdmVudEVtaXR0ZXI8SU9uUGFja2V0c2VuZEV2ZW50PiB7XHJcbiAgICByZXR1cm4gdGhpcy5fb25QYWNrZXRzZW5kO1xyXG4gIH1cclxuXHJcbiAgLyoqIEFuIEV2ZW50RW1pdHRlciB0byBsaXN0ZW4gdG8gcGFja2V0cmVjZWl2ZSBtZXNzYWdlcyAqL1xyXG4gIHB1YmxpYyBnZXQgb25QYWNrZXRyZWNlaXZlKCk6IEV2ZW50RW1pdHRlcjxJT25QYWNrZXRyZWNlaXZlRXZlbnQ+IHtcclxuICAgIHJldHVybiB0aGlzLl9vblBhY2tldHJlY2VpdmU7XHJcbiAgfVxyXG5cclxuICAvKiogQW4gRXZlbnRFbWl0dGVyIHRvIGxpc3RlbiB0byBzdWJhY2sgZXZlbnRzICovXHJcbiAgcHVibGljIGdldCBvblN1YmFjaygpOiBFdmVudEVtaXR0ZXI8SU9uU3ViYWNrRXZlbnQ+IHtcclxuICAgIHJldHVybiB0aGlzLl9vblN1YmFjaztcclxuICB9XHJcbiAgLyoqIGEgbWFwIG9mIGFsbCBtcXR0IG9ic2VydmFibGVzIGJ5IGZpbHRlciAqL1xyXG4gIHB1YmxpYyBvYnNlcnZhYmxlczogeyBbZmlsdGVyU3RyaW5nOiBzdHJpbmddOiBPYnNlcnZhYmxlPElNcXR0TWVzc2FnZT4gfSA9IHt9O1xyXG4gIC8qKiB0aGUgY29ubmVjdGlvbiBzdGF0ZSAqL1xyXG4gIHB1YmxpYyBzdGF0ZTogQmVoYXZpb3JTdWJqZWN0PE1xdHRDb25uZWN0aW9uU3RhdGU+ID0gbmV3IEJlaGF2aW9yU3ViamVjdChNcXR0Q29ubmVjdGlvblN0YXRlLkNMT1NFRCk7XHJcbiAgLyoqIGFuIG9ic2VydmFibGUgb2YgdGhlIGxhc3QgbXF0dCBtZXNzYWdlICovXHJcbiAgcHVibGljIG1lc3NhZ2VzOiBTdWJqZWN0PElNcXR0TWVzc2FnZT4gPSBuZXcgU3ViamVjdDxJTXF0dE1lc3NhZ2U+KCk7XHJcblxyXG4gIHByaXZhdGUgX2NsaWVudElkID0gdGhpcy5fZ2VuZXJhdGVDbGllbnRJZCgpO1xyXG4gIHByaXZhdGUgX2Nvbm5lY3RUaW1lb3V0ID0gMTAwMDA7XHJcbiAgcHJpdmF0ZSBfcmVjb25uZWN0UGVyaW9kID0gMTAwMDA7XHJcbiAgcHJpdmF0ZSBfdXJsOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XHJcblxyXG4gIHByaXZhdGUgX29uQ29ubmVjdDogRXZlbnRFbWl0dGVyPElPbkNvbm5lY3RFdmVudD4gPSBuZXcgRXZlbnRFbWl0dGVyPElPbkNvbm5lY3RFdmVudD4oKTtcclxuICBwcml2YXRlIF9vblJlY29ubmVjdDogRXZlbnRFbWl0dGVyPHZvaWQ+ID0gbmV3IEV2ZW50RW1pdHRlcjx2b2lkPigpO1xyXG4gIHByaXZhdGUgX29uQ2xvc2U6IEV2ZW50RW1pdHRlcjx2b2lkPiA9IG5ldyBFdmVudEVtaXR0ZXI8dm9pZD4oKTtcclxuICBwcml2YXRlIF9vbk9mZmxpbmU6IEV2ZW50RW1pdHRlcjx2b2lkPiA9IG5ldyBFdmVudEVtaXR0ZXI8dm9pZD4oKTtcclxuICBwcml2YXRlIF9vbkVycm9yOiBFdmVudEVtaXR0ZXI8SU9uRXJyb3JFdmVudD4gPSBuZXcgRXZlbnRFbWl0dGVyPElPbkVycm9yRXZlbnQ+KCk7XHJcbiAgcHJpdmF0ZSBfb25FbmQ6IEV2ZW50RW1pdHRlcjx2b2lkPiA9IG5ldyBFdmVudEVtaXR0ZXI8dm9pZD4oKTtcclxuICBwcml2YXRlIF9vbk1lc3NhZ2U6IEV2ZW50RW1pdHRlcjxJT25NZXNzYWdlRXZlbnQ+ID0gbmV3IEV2ZW50RW1pdHRlcjxJT25NZXNzYWdlRXZlbnQ+KCk7XHJcbiAgcHJpdmF0ZSBfb25TdWJhY2s6IEV2ZW50RW1pdHRlcjxJT25TdWJhY2tFdmVudD4gPSBuZXcgRXZlbnRFbWl0dGVyPElPblN1YmFja0V2ZW50PigpO1xyXG4gIHByaXZhdGUgX29uUGFja2V0c2VuZDogRXZlbnRFbWl0dGVyPElPblBhY2tldHNlbmRFdmVudD4gPSBuZXcgRXZlbnRFbWl0dGVyPElPblBhY2tldHNlbmRFdmVudD4oKTtcclxuICBwcml2YXRlIF9vblBhY2tldHJlY2VpdmU6IEV2ZW50RW1pdHRlcjxJT25QYWNrZXRyZWNlaXZlRXZlbnQ+ID0gbmV3IEV2ZW50RW1pdHRlcjxJT25QYWNrZXRyZWNlaXZlRXZlbnQ+KCk7XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoaXMgc3RhdGljIG1ldGhvZCBzaGFsbCBiZSB1c2VkIHRvIGRldGVybWluZSB3aGV0aGVyIGEgTVFUVFxyXG4gICAqIHRvcGljIG1hdGNoZXMgYSBnaXZlbiBmaWx0ZXIuIFRoZSBtYXRjaGluZyBydWxlcyBhcmUgc3BlY2lmaWVkIGluIHRoZSBNUVRUXHJcbiAgICogc3RhbmRhcmQgZG9jdW1lbnRhdGlvbiBhbmQgaW4gdGhlIGxpYnJhcnkgdGVzdCBzdWl0ZS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSAge3N0cmluZ30gIGZpbHRlciBBIGZpbHRlciBtYXkgY29udGFpbiB3aWxkY2FyZHMgbGlrZSAnIycgYW5kICcrJy5cclxuICAgKiBAcGFyYW0gIHtzdHJpbmd9ICB0b3BpYyAgQSB0b3BpYyBtYXkgbm90IGNvbnRhaW4gd2lsZGNhcmRzLlxyXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59ICAgICAgICB0cnVlIG9uIG1hdGNoIGFuZCBmYWxzZSBvdGhlcndpc2UuXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBmaWx0ZXJNYXRjaGVzVG9waWMoZmlsdGVyU3RyaW5nOiBzdHJpbmcsIHRvcGljOiBzdHJpbmcpOiBib29sZWFuIHtcclxuICAgIGlmIChmaWx0ZXJTdHJpbmdbMF0gPT09ICcjJyAmJiB0b3BpY1swXSA9PT0gJyQnKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIC8vIFByZXBhcmF0aW9uOiBzcGxpdCBhbmQgcmV2ZXJzZSBvbiAnLycuIFRoZSBKYXZhU2NyaXB0IHNwbGl0IGZ1bmN0aW9uIGlzIHNhbmUuXHJcbiAgICBjb25zdCBmcyA9IChmaWx0ZXJTdHJpbmcgfHwgJycpLnNwbGl0KCcvJykucmV2ZXJzZSgpO1xyXG4gICAgY29uc3QgdHMgPSAodG9waWMgfHwgJycpLnNwbGl0KCcvJykucmV2ZXJzZSgpO1xyXG4gICAgLy8gVGhpcyBmdW5jdGlvbiBpcyB0YWlsIHJlY3Vyc2l2ZSBhbmQgY29tcGFyZXMgYm90aCBhcnJheXMgb25lIGVsZW1lbnQgYXQgYSB0aW1lLlxyXG4gICAgY29uc3QgbWF0Y2ggPSAoKTogYm9vbGVhbiA9PiB7XHJcbiAgICAgIC8vIEN1dHRpbmcgb2YgdGhlIGxhc3QgZWxlbWVudCBvZiBib3RoIHRoZSBmaWx0ZXIgYW5kIHRoZSB0b3BpYyB1c2luZyBwb3AoKS5cclxuICAgICAgY29uc3QgZiA9IGZzLnBvcCgpO1xyXG4gICAgICBjb25zdCB0ID0gdHMucG9wKCk7XHJcbiAgICAgIHN3aXRjaCAoZikge1xyXG4gICAgICAgIC8vIEluIGNhc2UgdGhlIGZpbHRlciBsZXZlbCBpcyAnIycsIHRoaXMgaXMgYSBtYXRjaCBubyBtYXR0ZXIgd2hldGhlclxyXG4gICAgICAgIC8vIHRoZSB0b3BpYyBpcyB1bmRlZmluZWQgb24gdGhpcyBsZXZlbCBvciBub3QgKCcjJyBtYXRjaGVzIHBhcmVudCBlbGVtZW50IGFzIHdlbGwhKS5cclxuICAgICAgICBjYXNlICcjJzpcclxuICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIC8vIEluIGNhc2UgdGhlIGZpbHRlciBsZXZlbCBpcyAnKycsIHdlIHNoYWxsIGRpdmUgaW50byB0aGUgcmVjdXJzaW9uIG9ubHkgaWYgdCBpcyBub3QgdW5kZWZpbmVkLlxyXG4gICAgICAgIGNhc2UgJysnOlxyXG4gICAgICAgICAgcmV0dXJuIHQgPyBtYXRjaCgpIDogZmFsc2U7XHJcbiAgICAgICAgLy8gSW4gYWxsIG90aGVyIGNhc2VzIHRoZSBmaWx0ZXIgbGV2ZWwgbXVzdCBtYXRjaCB0aGUgdG9waWMgbGV2ZWwsXHJcbiAgICAgICAgLy8gYm90aCBtdXN0IGJlIGRlZmluZWQgYW5kIHRoZSBmaWx0ZXIgdGFpbCBtdXN0IG1hdGNoIHRoZSB0b3BpY1xyXG4gICAgICAgIC8vIHRhaWwgKHdoaWNoIGlzIGRldGVybWluZWQgYnkgdGhlIHJlY3Vyc2l2ZSBjYWxsIG9mIG1hdGNoKCkpLlxyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICByZXR1cm4gZiA9PT0gdCAmJiAoZiA9PT0gdW5kZWZpbmVkID8gdHJ1ZSA6IG1hdGNoKCkpO1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIG1hdGNoKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBjb25uZWN0IG1hbnVhbGx5IGNvbm5lY3RzIHRvIHRoZSBtcXR0IGJyb2tlci5cclxuICAgKi9cclxuICBwdWJsaWMgY29ubmVjdChvcHRzPzogSU1xdHRTZXJ2aWNlT3B0aW9ucywgY2xpZW50PzogSU1xdHRDbGllbnQpIHtcclxuICAgIGNvbnN0IG9wdGlvbnMgPSBleHRlbmQodGhpcy5vcHRpb25zIHx8IHt9LCBvcHRzKTtcclxuICAgIGNvbnN0IHByb3RvY29sID0gb3B0aW9ucy5wcm90b2NvbCB8fCAnd3MnO1xyXG4gICAgY29uc3QgaG9zdG5hbWUgPSBvcHRpb25zLmhvc3RuYW1lIHx8ICdsb2NhbGhvc3QnO1xyXG4gICAgaWYgKG9wdGlvbnMudXJsKSB7XHJcbiAgICAgIHRoaXMuX3VybCA9IG9wdGlvbnMudXJsO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5fdXJsID0gYCR7cHJvdG9jb2x9Oi8vJHtob3N0bmFtZX1gO1xyXG4gICAgICB0aGlzLl91cmwgKz0gb3B0aW9ucy5wb3J0ID8gYDoke29wdGlvbnMucG9ydH1gIDogJyc7XHJcbiAgICAgIHRoaXMuX3VybCArPSBvcHRpb25zLnBhdGggPyBgJHtvcHRpb25zLnBhdGh9YCA6ICcnO1xyXG4gICAgfVxyXG4gICAgdGhpcy5zdGF0ZS5uZXh0KE1xdHRDb25uZWN0aW9uU3RhdGUuQ09OTkVDVElORyk7XHJcbiAgICBjb25zdCBtZXJnZWRPcHRpb25zID0gZXh0ZW5kKHtcclxuICAgICAgY2xpZW50SWQ6IHRoaXMuX2NsaWVudElkLFxyXG4gICAgICByZWNvbm5lY3RQZXJpb2Q6IHRoaXMuX3JlY29ubmVjdFBlcmlvZCxcclxuICAgICAgY29ubmVjdFRpbWVvdXQ6IHRoaXMuX2Nvbm5lY3RUaW1lb3V0XHJcbiAgICB9LCBvcHRpb25zKTtcclxuXHJcbiAgICBpZiAodGhpcy5jbGllbnQpIHtcclxuICAgICAgdGhpcy5jbGllbnQuZW5kKHRydWUpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghY2xpZW50KSB7XHJcbiAgICAgIHRoaXMuY2xpZW50ID0gKGNvbm5lY3QodGhpcy5fdXJsLCBtZXJnZWRPcHRpb25zKSBhcyBJTXF0dENsaWVudCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLmNsaWVudCA9IGNsaWVudDtcclxuICAgIH1cclxuICAgIHRoaXMuX2NsaWVudElkID0gbWVyZ2VkT3B0aW9ucy5jbGllbnRJZDtcclxuXHJcbiAgICB0aGlzLmNsaWVudC5vbignY29ubmVjdCcsIHRoaXMuX2hhbmRsZU9uQ29ubmVjdCk7XHJcbiAgICB0aGlzLmNsaWVudC5vbigncmVjb25uZWN0JywgdGhpcy5faGFuZGxlT25SZWNvbm5lY3QpO1xyXG4gICAgdGhpcy5jbGllbnQub24oJ2Nsb3NlJywgdGhpcy5faGFuZGxlT25DbG9zZSk7XHJcbiAgICB0aGlzLmNsaWVudC5vbignb2ZmbGluZScsIHRoaXMuX2hhbmRsZU9uT2ZmbGluZSk7XHJcbiAgICB0aGlzLmNsaWVudC5vbignZXJyb3InLCB0aGlzLl9oYW5kbGVPbkVycm9yKTtcclxuICAgIHRoaXMuY2xpZW50LnN0cmVhbS5vbignZXJyb3InLCB0aGlzLl9oYW5kbGVPbkVycm9yKTtcclxuICAgIHRoaXMuY2xpZW50Lm9uKCdlbmQnLCB0aGlzLl9oYW5kbGVPbkVuZCk7XHJcbiAgICB0aGlzLmNsaWVudC5vbignbWVzc2FnZScsIHRoaXMuX2hhbmRsZU9uTWVzc2FnZSk7XHJcbiAgICB0aGlzLmNsaWVudC5vbigncGFja2V0c2VuZCcsIHRoaXMuX2hhbmRsZU9uUGFja2V0c2VuZCk7XHJcbiAgICB0aGlzLmNsaWVudC5vbigncGFja2V0cmVjZWl2ZScsIHRoaXMuX2hhbmRsZU9uUGFja2V0cmVjZWl2ZSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBkaXNjb25uZWN0IGRpc2Nvbm5lY3RzIGZyb20gdGhlIG1xdHQgY2xpZW50LlxyXG4gICAqIFRoaXMgbWV0aG9kIGBzaG91bGRgIGJlIGV4ZWN1dGVkIHdoZW4gbGVhdmluZyB0aGUgYXBwbGljYXRpb24uXHJcbiAgICovXHJcbiAgcHVibGljIGRpc2Nvbm5lY3QoZm9yY2UgPSB0cnVlKSB7XHJcbiAgICBpZiAoIXRoaXMuY2xpZW50KSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignbXF0dCBjbGllbnQgbm90IGNvbm5lY3RlZCcpO1xyXG4gICAgfVxyXG4gICAgdGhpcy5jbGllbnQuZW5kKGZvcmNlKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFdpdGggdGhpcyBtZXRob2QsIHlvdSBjYW4gb2JzZXJ2ZSBtZXNzYWdlcyBmb3IgYSBtcXR0IHRvcGljLlxyXG4gICAqIFRoZSBvYnNlcnZhYmxlIHdpbGwgb25seSBlbWl0IG1lc3NhZ2VzIG1hdGNoaW5nIHRoZSBmaWx0ZXIuXHJcbiAgICogVGhlIGZpcnN0IG9uZSBzdWJzY3JpYmluZyB0byB0aGUgcmVzdWx0aW5nIG9ic2VydmFibGUgZXhlY3V0ZXMgYSBtcXR0IHN1YnNjcmliZS5cclxuICAgKiBUaGUgbGFzdCBvbmUgdW5zdWJzY3JpYmluZyB0aGlzIGZpbHRlciBleGVjdXRlcyBhIG1xdHQgdW5zdWJzY3JpYmUuXHJcbiAgICogRXZlcnkgbmV3IHN1YnNjcmliZXIgZ2V0cyB0aGUgbGF0ZXN0IG1lc3NhZ2UuXHJcbiAgICovXHJcbiAgcHVibGljIG9ic2VydmVSZXRhaW5lZChmaWx0ZXJTdHJpbmc6IHN0cmluZywgb3B0czogSUNsaWVudFN1YnNjcmliZU9wdGlvbnMgPSB7cW9zOiAxfSk6IE9ic2VydmFibGU8SU1xdHRNZXNzYWdlPiB7XHJcbiAgICByZXR1cm4gdGhpcy5fZ2VuZXJhbE9ic2VydmUoZmlsdGVyU3RyaW5nLCAoKSA9PiBwdWJsaXNoUmVwbGF5KDEpLCBvcHRzKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFdpdGggdGhpcyBtZXRob2QsIHlvdSBjYW4gb2JzZXJ2ZSBtZXNzYWdlcyBmb3IgYSBtcXR0IHRvcGljLlxyXG4gICAqIFRoZSBvYnNlcnZhYmxlIHdpbGwgb25seSBlbWl0IG1lc3NhZ2VzIG1hdGNoaW5nIHRoZSBmaWx0ZXIuXHJcbiAgICogVGhlIGZpcnN0IG9uZSBzdWJzY3JpYmluZyB0byB0aGUgcmVzdWx0aW5nIG9ic2VydmFibGUgZXhlY3V0ZXMgYSBtcXR0IHN1YnNjcmliZS5cclxuICAgKiBUaGUgbGFzdCBvbmUgdW5zdWJzY3JpYmluZyB0aGlzIGZpbHRlciBleGVjdXRlcyBhIG1xdHQgdW5zdWJzY3JpYmUuXHJcbiAgICovXHJcbiAgcHVibGljIG9ic2VydmUoZmlsdGVyU3RyaW5nOiBzdHJpbmcsIG9wdHM6IElDbGllbnRTdWJzY3JpYmVPcHRpb25zID0ge3FvczogMX0pOiBPYnNlcnZhYmxlPElNcXR0TWVzc2FnZT4ge1xyXG4gICAgcmV0dXJuIHRoaXMuX2dlbmVyYWxPYnNlcnZlKGZpbHRlclN0cmluZywgKCkgPT4gcHVibGlzaCgpLCBvcHRzKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFdpdGggdGhpcyBtZXRob2QsIHlvdSBjYW4gb2JzZXJ2ZSBtZXNzYWdlcyBmb3IgYSBtcXR0IHRvcGljLlxyXG4gICAqIFRoZSBvYnNlcnZhYmxlIHdpbGwgb25seSBlbWl0IG1lc3NhZ2VzIG1hdGNoaW5nIHRoZSBmaWx0ZXIuXHJcbiAgICogVGhlIGZpcnN0IG9uZSBzdWJzY3JpYmluZyB0byB0aGUgcmVzdWx0aW5nIG9ic2VydmFibGUgZXhlY3V0ZXMgYSBtcXR0IHN1YnNjcmliZS5cclxuICAgKiBUaGUgbGFzdCBvbmUgdW5zdWJzY3JpYmluZyB0aGlzIGZpbHRlciBleGVjdXRlcyBhIG1xdHQgdW5zdWJzY3JpYmUuXHJcbiAgICogRGVwZW5kaW5nIG9uIHRoZSBwdWJsaXNoIGZ1bmN0aW9uLCB0aGUgbWVzc2FnZXMgd2lsbCBlaXRoZXIgYmUgcmVwbGF5ZWQgYWZ0ZXIgbmV3XHJcbiAgICogc3Vic2NyaWJlcnMgc3Vic2NyaWJlIG9yIHRoZSBtZXNzYWdlcyBhcmUganVzdCBwYXNzZWQgdGhyb3VnaFxyXG4gICAqL1xyXG4gIHByaXZhdGUgX2dlbmVyYWxPYnNlcnZlKGZpbHRlclN0cmluZzogc3RyaW5nLCBwdWJsaXNoRm46IEZ1bmN0aW9uLCBvcHRzOiBJQ2xpZW50U3Vic2NyaWJlT3B0aW9ucyk6IE9ic2VydmFibGU8SU1xdHRNZXNzYWdlPiB7XHJcbiAgICBpZiAoIXRoaXMuY2xpZW50KSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignbXF0dCBjbGllbnQgbm90IGNvbm5lY3RlZCcpO1xyXG4gICAgfVxyXG4gICAgaWYgKCF0aGlzLm9ic2VydmFibGVzW2ZpbHRlclN0cmluZ10pIHtcclxuICAgICAgY29uc3QgcmVqZWN0ZWQ6IFN1YmplY3Q8SU1xdHRNZXNzYWdlPiA9IG5ldyBTdWJqZWN0KCk7XHJcbiAgICAgIHRoaXMub2JzZXJ2YWJsZXNbZmlsdGVyU3RyaW5nXSA9IHVzaW5nKFxyXG4gICAgICAgIC8vIHJlc291cmNlRmFjdG9yeTogRG8gdGhlIGFjdHVhbCByZWYtY291bnRpbmcgTVFUVCBzdWJzY3JpcHRpb24uXHJcbiAgICAgICAgLy8gcmVmY291bnQgaXMgZGVjcmVhc2VkIG9uIHVuc3Vic2NyaWJlLlxyXG4gICAgICAgICgpID0+IHtcclxuICAgICAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbjogU3Vic2NyaXB0aW9uID0gbmV3IFN1YnNjcmlwdGlvbigpO1xyXG4gICAgICAgICAgdGhpcy5jbGllbnQuc3Vic2NyaWJlKGZpbHRlclN0cmluZywgb3B0cywgKGVyciwgZ3JhbnRlZDogSVN1YnNjcmlwdGlvbkdyYW50W10pID0+IHtcclxuICAgICAgICAgICAgaWYgKGdyYW50ZWQpIHsgLy8gZ3JhbnRlZCBjYW4gYmUgdW5kZWZpbmVkIHdoZW4gYW4gZXJyb3Igb2NjdXJzIHdoZW4gdGhlIGNsaWVudCBpcyBkaXNjb25uZWN0aW5nXHJcbiAgICAgICAgICAgICAgZ3JhbnRlZC5mb3JFYWNoKChncmFudGVkXzogSVN1YnNjcmlwdGlvbkdyYW50KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZ3JhbnRlZF8ucW9zID09PSAxMjgpIHtcclxuICAgICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMub2JzZXJ2YWJsZXNbZ3JhbnRlZF8udG9waWNdO1xyXG4gICAgICAgICAgICAgICAgICB0aGlzLmNsaWVudC51bnN1YnNjcmliZShncmFudGVkXy50b3BpYyk7XHJcbiAgICAgICAgICAgICAgICAgIHJlamVjdGVkLmVycm9yKGBzdWJzY3JpcHRpb24gZm9yICcke2dyYW50ZWRfLnRvcGljfScgcmVqZWN0ZWQhYCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9vblN1YmFjay5lbWl0KHtmaWx0ZXI6IGZpbHRlclN0cmluZywgZ3JhbnRlZDogZ3JhbnRlZF8ucW9zICE9PSAxMjh9KTtcclxuICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgICBzdWJzY3JpcHRpb24uYWRkKCgpID0+IHtcclxuICAgICAgICAgICAgZGVsZXRlIHRoaXMub2JzZXJ2YWJsZXNbZmlsdGVyU3RyaW5nXTtcclxuICAgICAgICAgICAgdGhpcy5jbGllbnQudW5zdWJzY3JpYmUoZmlsdGVyU3RyaW5nKTtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgcmV0dXJuIHN1YnNjcmlwdGlvbjtcclxuICAgICAgICB9LFxyXG4gICAgICAgIC8vIG9ic2VydmFibGVGYWN0b3J5OiBDcmVhdGUgdGhlIG9ic2VydmFibGUgdGhhdCBpcyBjb25zdW1lZCBmcm9tLlxyXG4gICAgICAgIC8vIFRoaXMgcGFydCBpcyBub3QgZXhlY3V0ZWQgdW50aWwgdGhlIE9ic2VydmFibGUgcmV0dXJuZWQgYnlcclxuICAgICAgICAvLyBgb2JzZXJ2ZWAgZ2V0cyBhY3R1YWxseSBzdWJzY3JpYmVkLlxyXG4gICAgICAgIChzdWJzY3JpcHRpb246IFVuc3Vic2NyaWJhYmxlIHwgdm9pZCkgPT4gbWVyZ2UocmVqZWN0ZWQsIHRoaXMubWVzc2FnZXMpKVxyXG4gICAgICAgIC5waXBlKFxyXG4gICAgICAgICAgZmlsdGVyKChtc2c6IElNcXR0TWVzc2FnZSkgPT4gTXF0dFNlcnZpY2UuZmlsdGVyTWF0Y2hlc1RvcGljKGZpbHRlclN0cmluZywgbXNnLnRvcGljKSksXHJcbiAgICAgICAgICBwdWJsaXNoRm4oKSxcclxuICAgICAgICAgIHJlZkNvdW50KClcclxuICAgICAgICApIGFzIE9ic2VydmFibGU8SU1xdHRNZXNzYWdlPjtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzLm9ic2VydmFibGVzW2ZpbHRlclN0cmluZ107XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUaGlzIG1ldGhvZCByZXR1cm5zIGFuIG9ic2VydmFibGUgZm9yIGEgdG9waWMgd2l0aCBvcHRpb25hbCBvcHRpb25zLlxyXG4gICAqIEFmdGVyIHN1YnNjcmliaW5nLCB0aGUgYWN0dWFsIG1xdHQgcHVibGljYXRpb24gd2lsbCBiZSBleGVjdXRlZCBhbmRcclxuICAgKiB0aGUgb2JzZXJ2YWJsZSB3aWxsIGVtaXQgYW4gZW1wdHkgdmFsdWUgYW5kIGNvbXBsZXRlcywgaWYgcHVibGlzaGluZyB3YXMgc3VjY2Vzc2Z1bFxyXG4gICAqIG9yIHRocm93cyBhbiBlcnJvciwgaWYgdGhlIHB1YmxpY2F0aW9uIGZhaWxzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBwdWJsaXNoKHRvcGljOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZyB8IEJ1ZmZlciwgb3B0aW9ucz86IElQdWJsaXNoT3B0aW9ucyk6IE9ic2VydmFibGU8dm9pZD4ge1xyXG4gICAgaWYgKCF0aGlzLmNsaWVudCkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ21xdHQgY2xpZW50IG5vdCBjb25uZWN0ZWQnKTtcclxuICAgIH1cclxuICAgIHJldHVybiBPYnNlcnZhYmxlLmNyZWF0ZSgob2JzOiBPYnNlcnZlcjx2b2lkPikgPT4ge1xyXG4gICAgICB0aGlzLmNsaWVudC5wdWJsaXNoKHRvcGljLCBtZXNzYWdlLCBvcHRpb25zLCAoZXJyOiBFcnJvcikgPT4ge1xyXG4gICAgICAgIGlmIChlcnIpIHtcclxuICAgICAgICAgIG9icy5lcnJvcihlcnIpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBvYnMubmV4dChudWxsKTtcclxuICAgICAgICAgIG9icy5jb21wbGV0ZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoaXMgbWV0aG9kIHB1Ymxpc2hlcyBhIG1lc3NhZ2UgZm9yIGEgdG9waWMgd2l0aCBvcHRpb25hbCBvcHRpb25zLlxyXG4gICAqIElmIGFuIGVycm9yIG9jY3VycywgaXQgd2lsbCB0aHJvdy5cclxuICAgKi9cclxuICBwdWJsaWMgdW5zYWZlUHVibGlzaCh0b3BpYzogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcgfCBCdWZmZXIsIG9wdGlvbnM/OiBJUHVibGlzaE9wdGlvbnMpOiB2b2lkIHtcclxuICAgIGlmICghdGhpcy5jbGllbnQpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdtcXR0IGNsaWVudCBub3QgY29ubmVjdGVkJyk7XHJcbiAgICB9XHJcbiAgICB0aGlzLmNsaWVudC5wdWJsaXNoKHRvcGljLCBtZXNzYWdlLCBvcHRpb25zLCAoZXJyOiBFcnJvcikgPT4ge1xyXG4gICAgICBpZiAoZXJyKSB7XHJcbiAgICAgICAgdGhyb3cgKGVycik7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBfaGFuZGxlT25Db25uZWN0ID0gKGU6IElPbkNvbm5lY3RFdmVudCkgPT4ge1xyXG4gICAgaWYgKHRoaXMub3B0aW9ucy5jb25uZWN0T25DcmVhdGUgPT09IHRydWUpIHtcclxuICAgICAgT2JqZWN0LmtleXModGhpcy5vYnNlcnZhYmxlcykuZm9yRWFjaCgoZmlsdGVyU3RyaW5nOiBzdHJpbmcpID0+IHtcclxuICAgICAgICB0aGlzLmNsaWVudC5zdWJzY3JpYmUoZmlsdGVyU3RyaW5nKTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICB0aGlzLnN0YXRlLm5leHQoTXF0dENvbm5lY3Rpb25TdGF0ZS5DT05ORUNURUQpO1xyXG4gICAgdGhpcy5fb25Db25uZWN0LmVtaXQoZSk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIF9oYW5kbGVPblJlY29ubmVjdCA9ICgpID0+IHtcclxuICAgIGlmICh0aGlzLm9wdGlvbnMuY29ubmVjdE9uQ3JlYXRlID09PSB0cnVlKSB7XHJcbiAgICAgIE9iamVjdC5rZXlzKHRoaXMub2JzZXJ2YWJsZXMpLmZvckVhY2goKGZpbHRlclN0cmluZzogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgdGhpcy5jbGllbnQuc3Vic2NyaWJlKGZpbHRlclN0cmluZyk7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgdGhpcy5zdGF0ZS5uZXh0KE1xdHRDb25uZWN0aW9uU3RhdGUuQ09OTkVDVElORyk7XHJcbiAgICB0aGlzLl9vblJlY29ubmVjdC5lbWl0KCk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIF9oYW5kbGVPbkNsb3NlID0gKCkgPT4ge1xyXG4gICAgdGhpcy5zdGF0ZS5uZXh0KE1xdHRDb25uZWN0aW9uU3RhdGUuQ0xPU0VEKTtcclxuICAgIHRoaXMuX29uQ2xvc2UuZW1pdCgpO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBfaGFuZGxlT25PZmZsaW5lID0gKCkgPT4ge1xyXG4gICAgdGhpcy5fb25PZmZsaW5lLmVtaXQoKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgX2hhbmRsZU9uRXJyb3IgPSAoZTogSU9uRXJyb3JFdmVudCkgPT4ge1xyXG4gICAgdGhpcy5fb25FcnJvci5lbWl0KGUpO1xyXG4gICAgY29uc29sZS5lcnJvcihlKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgX2hhbmRsZU9uRW5kID0gKCkgPT4ge1xyXG4gICAgdGhpcy5fb25FbmQuZW1pdCgpO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBfaGFuZGxlT25NZXNzYWdlID0gKHRvcGljOiBzdHJpbmcsIG1zZywgcGFja2V0OiBJTXF0dE1lc3NhZ2UpID0+IHtcclxuICAgIHRoaXMuX29uTWVzc2FnZS5lbWl0KHBhY2tldCk7XHJcbiAgICBpZiAocGFja2V0LmNtZCA9PT0gJ3B1Ymxpc2gnKSB7XHJcbiAgICAgIHRoaXMubWVzc2FnZXMubmV4dChwYWNrZXQpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBfaGFuZGxlT25QYWNrZXRzZW5kID0gKGU6IElPblBhY2tldHNlbmRFdmVudCkgPT4ge1xyXG4gICAgdGhpcy5fb25QYWNrZXRzZW5kLmVtaXQoKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgX2hhbmRsZU9uUGFja2V0cmVjZWl2ZSA9IChlOiBJT25QYWNrZXRyZWNlaXZlRXZlbnQpID0+IHtcclxuICAgIHRoaXMuX29uUGFja2V0cmVjZWl2ZS5lbWl0KCk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIF9nZW5lcmF0ZUNsaWVudElkKCkge1xyXG4gICAgcmV0dXJuICdjbGllbnQtJyArIE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cigyLCAxOSk7XHJcbiAgfVxyXG59XHJcbiJdfQ==