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
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
require("rxjs/operator/map");
require("rxjs/operator/filter");
require("rxjs/operator/catch");
var keycloak_auth_service_1 = require("../services/keycloak.auth.service");
var keycloak_core_service_1 = require("../services/keycloak.core.service");
/**
 * An Angular http proxy supporting Keycloak auth & authz.
 * Authenticate user, manage tokens and add authorization header to access to remote Keycloak protected resources.
 */
var KeycloakHttp = KeycloakHttp_1 = (function (_super) {
    __extends(KeycloakHttp, _super);
    function KeycloakHttp(backend, defaultOptions, keycloak, keycloakAuth) {
        var _this = _super.call(this, backend, defaultOptions) || this;
        _this.keycloak = keycloak;
        _this.keycloakAuth = keycloakAuth;
        _this.MAX_UNAUTHORIZED_ATTEMPTS = 2;
        keycloak_core_service_1.Keycloak.http = new http_1.Http(backend, defaultOptions);
        _this.keycloak.init({});
        _this.keycloakAuth.init();
        return _this;
    }
    KeycloakHttp.prototype.get = function (url, options) {
        // console.info("GET");
        options = options || { withCredentials: false };
        options.method = http_1.RequestMethod.Get;
        return this.configureRequest(url, 1, options);
    };
    KeycloakHttp.prototype.post = function (url, body, options) {
        options = options || { withCredentials: false };
        options.method = http_1.RequestMethod.Post;
        options.body = body;
        return this.configureRequest(url, 1, options);
    };
    KeycloakHttp.prototype.put = function (url, body, options) {
        options = options || { withCredentials: false };
        options.method = http_1.RequestMethod.Put;
        options.body = body;
        return this.configureRequest(url, 1, options);
    };
    KeycloakHttp.prototype.delete = function (url, options) {
        options = options || { withCredentials: false };
        options.method = http_1.RequestMethod.Delete;
        return this.configureRequest(url, 1, options);
    };
    KeycloakHttp.prototype.patch = function (url, body, options) {
        options = options || { withCredentials: false };
        options.method = http_1.RequestMethod.Patch;
        options.body = body;
        return this.configureRequest(url, 1, options);
    };
    KeycloakHttp.prototype.head = function (url, options) {
        options = options || { withCredentials: false };
        options.method = http_1.RequestMethod.Head;
        return this.configureRequest(url, 1, options);
    };
    KeycloakHttp.prototype.configureRequest = function (url, count, options) {
        var _this = this;
        if (options.withCredentials && !KeycloakHttp_1.readyBehaviourSubject.getValue()) {
            keycloak_auth_service_1.KeycloakAuthorization.initializedObs.take(1).filter(function (init) { return init === true; }).subscribe(function () {
                console.info('KC_HTTP: keycloak authz initialized...');
            });
            keycloak_core_service_1.Keycloak.initializedObs.take(1).filter(function (init) { return init === true; }).subscribe(function () {
                if (!keycloak_core_service_1.Keycloak.authenticatedBehaviourSubject.getValue()) {
                    console.info('KC_HTTP: keycloak initialized, go login...');
                    keycloak_core_service_1.Keycloak.login(true);
                }
            });
            keycloak_core_service_1.Keycloak.authenticatedObs.take(2).filter(function (auth) { return auth === true; }).subscribe(function () {
                console.info('KC_HTTP: authentication done...');
                KeycloakHttp_1.readyBehaviourSubject.next(true);
            });
            return KeycloakHttp_1.readyObs.take(2).filter(function (ready) { return ready === true; }).flatMap(function (ready) {
                console.info('KC_HTTP: keycloak is now http ready, re-attempting request...');
                return _this.configureRequest(url, count, options);
            });
        }
        else {
            // KC is ready, getting authorization header
            return this.setHeaders(options).flatMap(function (options) {
                console.info('KC_HTTP: using headers ' + options);
                // calling http with headers
                return _super.prototype.request.call(_this, url, options).catch(function (error) {
                    // error handling
                    var status = error.status;
                    if ((status === 403 || status === 401) && count < _this.MAX_UNAUTHORIZED_ATTEMPTS) {
                        console.info('KC_HTTP: request is unauthorized!');
                        if (error.url.indexOf('/authorize') === -1) {
                            // auth error handling, observing for authorization
                            return new Rx_1.Observable(function (observer) {
                                if (error.headers.get('WWW-Authenticate') !== null) {
                                    // requesting authorization to KC server
                                    keycloak_auth_service_1.KeycloakAuthorization.authorize(error.headers.get('WWW-Authenticate')).subscribe(function (token) {
                                        // notifying observers for authz result token
                                        observer.next(token);
                                    });
                                }
                                else {
                                    console.warn('WWW-Authenticate header not found' + error.headers.get('WWW-Authenticate'));
                                }
                            });
                        }
                    }
                    else {
                        Rx_1.Observable.throw('server error');
                    }
                });
            }).flatMap(function (res) {
                // Http Response or Authz token
                if (res instanceof http_1.Response) {
                    // Http response
                    return new Rx_1.Observable(function (observer) {
                        return observer.next(res);
                    });
                }
                else {
                    // Authorization token
                    keycloak_core_service_1.Keycloak.accessToken = res;
                    count = count + 1;
                    // retrying request with new token
                    console.info('KC_HTTP: retrying request with new authorization token');
                    return _this.configureRequest(url, count, options);
                }
            });
        }
    };
    // to add 'Authorization' header
    KeycloakHttp.prototype.setHeaders = function (options) {
        return new Rx_1.Observable(function (observer) {
            if (options.withCredentials) {
                console.info('adding headers with options ' + options);
                var token_1 = keycloak_core_service_1.Keycloak.accessToken;
                if (keycloak_core_service_1.Keycloak.refreshToken) {
                    console.info('checking token');
                    keycloak_core_service_1.Keycloak.updateToken(5).subscribe(function (res) {
                        token_1 = res;
                        if (!options.headers) {
                            options.headers = new http_1.Headers();
                        }
                        console.info('returning an updated token');
                        options.headers.set('Authorization', 'Bearer ' + token_1);
                        observer.next(options);
                    });
                }
                else {
                    if (!options.headers) {
                        options.headers = new http_1.Headers();
                    }
                    console.info('returning the existing token ');
                    options.headers.set('Authorization', 'Bearer ' + token_1);
                    observer.next(options);
                }
            }
            else {
                observer.next(options);
            }
        });
    };
    return KeycloakHttp;
}(http_1.Http));
// Observable on service status.
// If true, keycloakHttp is ready to handle requests
KeycloakHttp.readyBehaviourSubject = new Rx_1.BehaviorSubject(false);
KeycloakHttp.readyObs = KeycloakHttp_1.readyBehaviourSubject.asObservable();
KeycloakHttp = KeycloakHttp_1 = __decorate([
    core_1.Injectable(),
    __metadata("design:paramtypes", [http_1.ConnectionBackend,
        http_1.RequestOptions,
        keycloak_core_service_1.Keycloak,
        keycloak_auth_service_1.KeycloakAuthorization])
], KeycloakHttp);
exports.KeycloakHttp = KeycloakHttp;
var KeycloakHttp_1;
//# sourceMappingURL=keycloak.http.service.js.map