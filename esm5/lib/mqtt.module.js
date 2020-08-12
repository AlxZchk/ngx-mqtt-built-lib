import { __decorate } from "tslib";
import { NgModule, InjectionToken } from '@angular/core';
export var MQTT_SERVICE_OPTIONS = {
    connectOnCreate: true,
    hostname: 'localhost',
    port: 1884,
    path: ''
};
export var MqttServiceConfig = new InjectionToken('NgxMqttServiceConfig');
export var MqttClientService = new InjectionToken('NgxMqttClientService');
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
export { MqttModule };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXF0dC5tb2R1bGUuanMiLCJzb3VyY2VSb290Ijoibmc6Ly9uZ3gtbXF0dC8iLCJzb3VyY2VzIjpbImxpYi9tcXR0Lm1vZHVsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxFQUNMLFFBQVEsRUFFUixjQUFjLEVBQ2YsTUFBTSxlQUFlLENBQUM7QUFHdkIsTUFBTSxDQUFDLElBQU0sb0JBQW9CLEdBQXdCO0lBQ3ZELGVBQWUsRUFBRSxJQUFJO0lBQ3JCLFFBQVEsRUFBRSxXQUFXO0lBQ3JCLElBQUksRUFBRSxJQUFJO0lBQ1YsSUFBSSxFQUFFLEVBQUU7Q0FDVCxDQUFDO0FBRUYsTUFBTSxDQUFDLElBQU0saUJBQWlCLEdBQUcsSUFBSSxjQUFjLENBQXNCLHNCQUFzQixDQUFDLENBQUM7QUFDakcsTUFBTSxDQUFDLElBQU0saUJBQWlCLEdBQUcsSUFBSSxjQUFjLENBQWMsc0JBQXNCLENBQUMsQ0FBQztBQUd6RjtJQUFBO0lBZ0JBLENBQUM7bUJBaEJZLFVBQVU7SUFDZCxrQkFBTyxHQUFkLFVBQWUsTUFBMkIsRUFBRSxNQUFvQjtRQUM5RCxPQUFPO1lBQ0wsUUFBUSxFQUFFLFlBQVU7WUFDcEIsU0FBUyxFQUFFO2dCQUNUO29CQUNFLE9BQU8sRUFBRSxpQkFBaUI7b0JBQzFCLFFBQVEsRUFBRSxNQUFNO2lCQUNqQjtnQkFDRDtvQkFDRSxPQUFPLEVBQUUsaUJBQWlCO29CQUMxQixRQUFRLEVBQUUsTUFBTTtpQkFDakI7YUFDRjtTQUNGLENBQUM7SUFDSixDQUFDOztJQWZVLFVBQVU7UUFEdEIsUUFBUSxFQUFFO09BQ0UsVUFBVSxDQWdCdEI7SUFBRCxpQkFBQztDQUFBLEFBaEJELElBZ0JDO1NBaEJZLFVBQVUiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xyXG4gIE5nTW9kdWxlLFxyXG4gIE1vZHVsZVdpdGhQcm92aWRlcnMsXHJcbiAgSW5qZWN0aW9uVG9rZW5cclxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcclxuaW1wb3J0IHsgSU1xdHRDbGllbnQsIElNcXR0U2VydmljZU9wdGlvbnMgfSBmcm9tICcuL21xdHQubW9kZWwnO1xyXG5cclxuZXhwb3J0IGNvbnN0IE1RVFRfU0VSVklDRV9PUFRJT05TOiBJTXF0dFNlcnZpY2VPcHRpb25zID0ge1xyXG4gIGNvbm5lY3RPbkNyZWF0ZTogdHJ1ZSxcclxuICBob3N0bmFtZTogJ2xvY2FsaG9zdCcsXHJcbiAgcG9ydDogMTg4NCxcclxuICBwYXRoOiAnJ1xyXG59O1xyXG5cclxuZXhwb3J0IGNvbnN0IE1xdHRTZXJ2aWNlQ29uZmlnID0gbmV3IEluamVjdGlvblRva2VuPElNcXR0U2VydmljZU9wdGlvbnM+KCdOZ3hNcXR0U2VydmljZUNvbmZpZycpO1xyXG5leHBvcnQgY29uc3QgTXF0dENsaWVudFNlcnZpY2UgPSBuZXcgSW5qZWN0aW9uVG9rZW48SU1xdHRDbGllbnQ+KCdOZ3hNcXR0Q2xpZW50U2VydmljZScpO1xyXG5cclxuQE5nTW9kdWxlKClcclxuZXhwb3J0IGNsYXNzIE1xdHRNb2R1bGUge1xyXG4gIHN0YXRpYyBmb3JSb290KGNvbmZpZzogSU1xdHRTZXJ2aWNlT3B0aW9ucywgY2xpZW50PzogSU1xdHRDbGllbnQpOiBNb2R1bGVXaXRoUHJvdmlkZXJzPE1xdHRNb2R1bGU+IHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIG5nTW9kdWxlOiBNcXR0TW9kdWxlLFxyXG4gICAgICBwcm92aWRlcnM6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICBwcm92aWRlOiBNcXR0U2VydmljZUNvbmZpZyxcclxuICAgICAgICAgIHVzZVZhbHVlOiBjb25maWdcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIHByb3ZpZGU6IE1xdHRDbGllbnRTZXJ2aWNlLFxyXG4gICAgICAgICAgdXNlVmFsdWU6IGNsaWVudFxyXG4gICAgICAgIH1cclxuICAgICAgXVxyXG4gICAgfTtcclxuICB9XHJcbn1cclxuIl19