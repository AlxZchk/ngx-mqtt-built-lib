/// <reference types="node" />
import { EventEmitter } from '@angular/core';
import { IClientSubscribeOptions } from 'mqtt';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { IMqttClient, IMqttMessage, IMqttServiceOptions, IOnConnectEvent, IOnErrorEvent, IOnMessageEvent, IOnPacketreceiveEvent, IOnPacketsendEvent, IOnSubackEvent, IPublishOptions, MqttConnectionState } from './mqtt.model';
/**
 * With an instance of MqttService, you can observe and subscribe to MQTT in multiple places, e.g. in different components,
 * to only subscribe to the broker once per MQTT filter.
 * It also handles proper unsubscription from the broker, if the last observable with a filter is closed.
 */
export declare class MqttService {
    private options;
    private client?;
    /**
     * The constructor needs [connection options]{@link IMqttServiceOptions} regarding the broker and some
     * options to configure behavior of this service, like if the connection to the broker
     * should be established on creation of this service or not.
     */
    constructor(options: IMqttServiceOptions, client?: IMqttClient);
    /**
     * gets the _clientId
     */
    get clientId(): string;
    /** An EventEmitter to listen to connect messages */
    get onConnect(): EventEmitter<IOnConnectEvent>;
    /** An EventEmitter to listen to reconnect messages */
    get onReconnect(): EventEmitter<void>;
    /** An EventEmitter to listen to close messages */
    get onClose(): EventEmitter<void>;
    /** An EventEmitter to listen to offline events */
    get onOffline(): EventEmitter<void>;
    /** An EventEmitter to listen to error events */
    get onError(): EventEmitter<IOnErrorEvent>;
    /** An EventEmitter to listen to close messages */
    get onEnd(): EventEmitter<void>;
    /** An EventEmitter to listen to message events */
    get onMessage(): EventEmitter<IOnMessageEvent>;
    /** An EventEmitter to listen to packetsend messages */
    get onPacketsend(): EventEmitter<IOnPacketsendEvent>;
    /** An EventEmitter to listen to packetreceive messages */
    get onPacketreceive(): EventEmitter<IOnPacketreceiveEvent>;
    /** An EventEmitter to listen to suback events */
    get onSuback(): EventEmitter<IOnSubackEvent>;
    /** a map of all mqtt observables by filter */
    observables: {
        [filterString: string]: Observable<IMqttMessage>;
    };
    /** the connection state */
    state: BehaviorSubject<MqttConnectionState>;
    /** an observable of the last mqtt message */
    messages: Subject<IMqttMessage>;
    private _clientId;
    private _connectTimeout;
    private _reconnectPeriod;
    private _url;
    private _onConnect;
    private _onReconnect;
    private _onClose;
    private _onOffline;
    private _onError;
    private _onEnd;
    private _onMessage;
    private _onSuback;
    private _onPacketsend;
    private _onPacketreceive;
    /**
     * This static method shall be used to determine whether a MQTT
     * topic matches a given filter. The matching rules are specified in the MQTT
     * standard documentation and in the library test suite.
     *
     * @param  {string}  filter A filter may contain wildcards like '#' and '+'.
     * @param  {string}  topic  A topic may not contain wildcards.
     * @return {boolean}        true on match and false otherwise.
     */
    static filterMatchesTopic(filterString: string, topic: string): boolean;
    /**
     * connect manually connects to the mqtt broker.
     */
    connect(opts?: IMqttServiceOptions, client?: IMqttClient): void;
    /**
     * disconnect disconnects from the mqtt client.
     * This method `should` be executed when leaving the application.
     */
    disconnect(force?: boolean): void;
    /**
     * With this method, you can observe messages for a mqtt topic.
     * The observable will only emit messages matching the filter.
     * The first one subscribing to the resulting observable executes a mqtt subscribe.
     * The last one unsubscribing this filter executes a mqtt unsubscribe.
     * Every new subscriber gets the latest message.
     */
    observeRetained(filterString: string, opts?: IClientSubscribeOptions): Observable<IMqttMessage>;
    /**
     * With this method, you can observe messages for a mqtt topic.
     * The observable will only emit messages matching the filter.
     * The first one subscribing to the resulting observable executes a mqtt subscribe.
     * The last one unsubscribing this filter executes a mqtt unsubscribe.
     */
    observe(filterString: string, opts?: IClientSubscribeOptions): Observable<IMqttMessage>;
    /**
     * With this method, you can observe messages for a mqtt topic.
     * The observable will only emit messages matching the filter.
     * The first one subscribing to the resulting observable executes a mqtt subscribe.
     * The last one unsubscribing this filter executes a mqtt unsubscribe.
     * Depending on the publish function, the messages will either be replayed after new
     * subscribers subscribe or the messages are just passed through
     */
    private _generalObserve;
    /**
     * This method returns an observable for a topic with optional options.
     * After subscribing, the actual mqtt publication will be executed and
     * the observable will emit an empty value and completes, if publishing was successful
     * or throws an error, if the publication fails.
     */
    publish(topic: string, message: string | Buffer, options?: IPublishOptions): Observable<void>;
    /**
     * This method publishes a message for a topic with optional options.
     * If an error occurs, it will throw.
     */
    unsafePublish(topic: string, message: string | Buffer, options?: IPublishOptions): void;
    private _handleOnConnect;
    private _handleOnReconnect;
    private _handleOnClose;
    private _handleOnOffline;
    private _handleOnError;
    private _handleOnEnd;
    private _handleOnMessage;
    private _handleOnPacketsend;
    private _handleOnPacketreceive;
    private _generateClientId;
}
