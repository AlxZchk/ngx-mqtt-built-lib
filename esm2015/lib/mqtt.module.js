var MqttModule_1;
import { __decorate } from "tslib";
import { NgModule, InjectionToken } from '@angular/core';
export const MQTT_SERVICE_OPTIONS = {
    connectOnCreate: true,
    hostname: 'localhost',
    port: 1884,
    path: ''
};
export const MqttServiceConfig = new InjectionToken('NgxMqttServiceConfig');
export const MqttClientService = new InjectionToken('NgxMqttClientService');
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
export { MqttModule };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXF0dC5tb2R1bGUuanMiLCJzb3VyY2VSb290Ijoibmc6Ly9uZ3gtbXF0dC8iLCJzb3VyY2VzIjpbImxpYi9tcXR0Lm1vZHVsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLE9BQU8sRUFDTCxRQUFRLEVBRVIsY0FBYyxFQUNmLE1BQU0sZUFBZSxDQUFDO0FBR3ZCLE1BQU0sQ0FBQyxNQUFNLG9CQUFvQixHQUF3QjtJQUN2RCxlQUFlLEVBQUUsSUFBSTtJQUNyQixRQUFRLEVBQUUsV0FBVztJQUNyQixJQUFJLEVBQUUsSUFBSTtJQUNWLElBQUksRUFBRSxFQUFFO0NBQ1QsQ0FBQztBQUVGLE1BQU0sQ0FBQyxNQUFNLGlCQUFpQixHQUFHLElBQUksY0FBYyxDQUFzQixzQkFBc0IsQ0FBQyxDQUFDO0FBQ2pHLE1BQU0sQ0FBQyxNQUFNLGlCQUFpQixHQUFHLElBQUksY0FBYyxDQUFjLHNCQUFzQixDQUFDLENBQUM7QUFHekYsSUFBYSxVQUFVLGtCQUF2QixNQUFhLFVBQVU7SUFDckIsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUEyQixFQUFFLE1BQW9CO1FBQzlELE9BQU87WUFDTCxRQUFRLEVBQUUsWUFBVTtZQUNwQixTQUFTLEVBQUU7Z0JBQ1Q7b0JBQ0UsT0FBTyxFQUFFLGlCQUFpQjtvQkFDMUIsUUFBUSxFQUFFLE1BQU07aUJBQ2pCO2dCQUNEO29CQUNFLE9BQU8sRUFBRSxpQkFBaUI7b0JBQzFCLFFBQVEsRUFBRSxNQUFNO2lCQUNqQjthQUNGO1NBQ0YsQ0FBQztJQUNKLENBQUM7Q0FDRixDQUFBO0FBaEJZLFVBQVU7SUFEdEIsUUFBUSxFQUFFO0dBQ0UsVUFBVSxDQWdCdEI7U0FoQlksVUFBVSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XHJcbiAgTmdNb2R1bGUsXHJcbiAgTW9kdWxlV2l0aFByb3ZpZGVycyxcclxuICBJbmplY3Rpb25Ub2tlblxyXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xyXG5pbXBvcnQgeyBJTXF0dENsaWVudCwgSU1xdHRTZXJ2aWNlT3B0aW9ucyB9IGZyb20gJy4vbXF0dC5tb2RlbCc7XHJcblxyXG5leHBvcnQgY29uc3QgTVFUVF9TRVJWSUNFX09QVElPTlM6IElNcXR0U2VydmljZU9wdGlvbnMgPSB7XHJcbiAgY29ubmVjdE9uQ3JlYXRlOiB0cnVlLFxyXG4gIGhvc3RuYW1lOiAnbG9jYWxob3N0JyxcclxuICBwb3J0OiAxODg0LFxyXG4gIHBhdGg6ICcnXHJcbn07XHJcblxyXG5leHBvcnQgY29uc3QgTXF0dFNlcnZpY2VDb25maWcgPSBuZXcgSW5qZWN0aW9uVG9rZW48SU1xdHRTZXJ2aWNlT3B0aW9ucz4oJ05neE1xdHRTZXJ2aWNlQ29uZmlnJyk7XHJcbmV4cG9ydCBjb25zdCBNcXR0Q2xpZW50U2VydmljZSA9IG5ldyBJbmplY3Rpb25Ub2tlbjxJTXF0dENsaWVudD4oJ05neE1xdHRDbGllbnRTZXJ2aWNlJyk7XHJcblxyXG5ATmdNb2R1bGUoKVxyXG5leHBvcnQgY2xhc3MgTXF0dE1vZHVsZSB7XHJcbiAgc3RhdGljIGZvclJvb3QoY29uZmlnOiBJTXF0dFNlcnZpY2VPcHRpb25zLCBjbGllbnQ/OiBJTXF0dENsaWVudCk6IE1vZHVsZVdpdGhQcm92aWRlcnM8TXF0dE1vZHVsZT4ge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgbmdNb2R1bGU6IE1xdHRNb2R1bGUsXHJcbiAgICAgIHByb3ZpZGVyczogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIHByb3ZpZGU6IE1xdHRTZXJ2aWNlQ29uZmlnLFxyXG4gICAgICAgICAgdXNlVmFsdWU6IGNvbmZpZ1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgcHJvdmlkZTogTXF0dENsaWVudFNlcnZpY2UsXHJcbiAgICAgICAgICB1c2VWYWx1ZTogY2xpZW50XHJcbiAgICAgICAgfVxyXG4gICAgICBdXHJcbiAgICB9O1xyXG4gIH1cclxufVxyXG4iXX0=