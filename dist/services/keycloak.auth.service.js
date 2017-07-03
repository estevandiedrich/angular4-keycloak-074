"use strict";
/*
 * Copyright 2017 ebondu and/or its affiliates
 * and other contributors as indicated by the @author tags.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var http_1 = require("@angular/http");
var Rx_1 = require("rxjs/Rx");
var keycloak_core_service_1 = require("./keycloak.core.service");
require("rxjs/operator/map");
/**
 * Keycloak Authorization manager.
 *
 * Manager authorization headers and tokens to access to protected resources.
 */
var KeycloakAuthorization = KeycloakAuthorization_1 = (function () {
    // constructor
    function KeycloakAuthorization(keycloak) {
        this.keycloak = keycloak;
    }
    /**
     * This method enables client applications to better integrate with resource servers protected by a Keycloak
     * policy enforcer.
     *
     * In this case, the resource server will respond with a 401 status code and a WWW-Authenticate header holding the
     * necessary information to ask a Keycloak server for authorization data using both UMA and Entitlement protocol,
     * depending on how the policy enforcer at the resource server was configured.
     */
    KeycloakAuthorization.authorize = function (wwwAuthenticateHeader) {
        var _this = this;
        if (wwwAuthenticateHeader.indexOf('UMA') !== -1) {
            var params = wwwAuthenticateHeader.split(',');
            var headers = void 0;
            var body = void 0;
            for (var i = 0; i < params.length; i++) {
                var param = params[i].split('=');
                if (param[0] === 'ticket') {
                    var ticket = param[1].substring(1, param[1].length - 1).trim();
                    headers = new http_1.Headers({ 'Content-type': 'application/json' });
                    headers.append('Authorization', 'Bearer ' + keycloak_core_service_1.Keycloak.accessToken);
                    body = JSON.stringify({
                        ticket: ticket,
                        rpt: this.rpt
                    });
                }
            }
            var options = { headers: headers };
            return keycloak_core_service_1.Keycloak.http.post(KeycloakAuthorization_1.config.rpt_endpoint, body, options).map(function (token) {
                var status = token.status;
                if (status >= 200 && status < 300) {
                    // Token retrieved
                    var rpt = JSON.parse(token.text()).rpt;
                    _this.rpt = rpt;
                    return rpt;
                }
                else if (status === 403) {
                    console.error('Authorization request was denied by the server.');
                    Rx_1.Observable.throw('Authorization request was denied by the server.');
                }
                else {
                    console.error('Could not obtain authorization data from server.');
                    Rx_1.Observable.throw('Could not obtain authorization data from server.');
                }
            });
        }
        else if (wwwAuthenticateHeader.indexOf('KC_ETT') !== -1) {
            var params = wwwAuthenticateHeader.substring('KC_ETT'.length).trim().split(',');
            var clientId = null;
            for (var i = 0; i < params.length; i++) {
                var param = params[i].split('=');
                if (param[0] === 'realm') {
                    clientId = param[1].substring(1, param[1].length - 1).trim();
                }
            }
            return this.entitlement(clientId);
        }
    };
    /**
     * Obtains all entitlements from a Keycloak Server based on a give resourceServerId.
     */
    KeycloakAuthorization.entitlement = function (resourceSeververId) {
        var _this = this;
        return new Rx_1.Observable(function (observer) {
            var url = keycloak_core_service_1.Keycloak.authServerUrl + '/realms/' + keycloak_core_service_1.Keycloak.realm + '/authz/entitlement/' + resourceSeververId;
            var headers = new http_1.Headers({ 'Authorization': 'Bearer ' + keycloak_core_service_1.Keycloak.accessToken });
            var options = { headers: headers };
            keycloak_core_service_1.Keycloak.http.get(url, options).map(function (token) {
                var status = token.status;
                if (status >= 200 && status < 300) {
                    var rpt = JSON.parse(token.text()).rpt;
                    _this.rpt = rpt;
                    observer.next(rpt);
                }
                else if (status === 403) {
                    console.error('Authorization request was denied by the server.');
                    Rx_1.Observable.throw('Authorization request was denied by the server.');
                }
                else {
                    console.error('Could not obtain authorization data from server.');
                    Rx_1.Observable.throw('Authorization request was denied by the server.');
                }
            });
        });
    };
    ;
    KeycloakAuthorization.prototype.init = function () {
        if (!KeycloakAuthorization_1.initializedBehaviourSubject.getValue()) {
            keycloak_core_service_1.Keycloak.initializedObs.filter(function (status) { return status === true; }).take(1).subscribe(function (status) {
                console.info('KC_AUTHZ: Keycloak initialized, loading authz...');
                var url = keycloak_core_service_1.Keycloak.authServerUrl + '/realms/' + keycloak_core_service_1.Keycloak.realm + '/.well-known/uma-configuration';
                var headers = new http_1.Headers({ 'Accept': 'application/json' });
                var options = { headers: headers };
                keycloak_core_service_1.Keycloak.http.get(url, options).subscribe(function (authz) {
                    KeycloakAuthorization_1.config = authz.json();
                    // notifying initialization
                    KeycloakAuthorization_1.initializedBehaviourSubject.next(true);
                });
            });
        }
        this.keycloak.init({});
    };
    ;
    return KeycloakAuthorization;
}());
KeycloakAuthorization.initializedBehaviourSubject = new Rx_1.BehaviorSubject(false);
KeycloakAuthorization.initializedObs = KeycloakAuthorization_1.initializedBehaviourSubject.asObservable();
KeycloakAuthorization = KeycloakAuthorization_1 = __decorate([
    core_1.Injectable(),
    __metadata("design:paramtypes", [keycloak_core_service_1.Keycloak])
], KeycloakAuthorization);
exports.KeycloakAuthorization = KeycloakAuthorization;
var KeycloakAuthorization_1;
//# sourceMappingURL=keycloak.auth.service.js.map