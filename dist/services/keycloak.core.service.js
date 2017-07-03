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
var keycloak_adapter_default_1 = require("../adapters/keycloak.adapter.default");
var Rx_1 = require("rxjs/Rx");
require("rxjs/operator/map");
var keycloak_adapter_cordova_1 = require("../adapters/keycloak.adapter.cordova");
var keycloak_storage_local_1 = require("../storage/keycloak.storage.local");
var keycloak_storage_cookie_1 = require("../storage/keycloak.storage.cookie");
var keycloak_utils_URIParser_1 = require("../utils/keycloak.utils.URIParser");
var keycloak_utils_loginIframe_1 = require("../utils/keycloak.utils.loginIframe");
var keycloak_utils_UUID_1 = require("../utils/keycloak.utils.UUID");
var keycloak_utils_token_1 = require("../utils/keycloak.utils.token");
var Keycloak = Keycloak_1 = (function () {
    // public constructor
    function Keycloak() {
        Keycloak_1.loginIframe = new keycloak_utils_loginIframe_1.LoginIframe(true, [], 5);
    }
    // Keycloak methods
    Keycloak.login = function (options) {
        return Keycloak_1.adapter.login(options);
    };
    Keycloak.logout = function (options) {
        return Keycloak_1.adapter.logout(options);
    };
    Keycloak.updateToken = function (minValidity) {
        var _this = this;
        return new Rx_1.Observable(function (observer) {
            minValidity = minValidity || 5;
            if (!Keycloak_1.isTokenExpired(minValidity)) {
                console.info('token still valid');
                observer.next(Keycloak_1.accessToken);
            }
            else {
                if (Keycloak_1.isRefreshTokenExpired(5)) {
                    Keycloak_1.login(Keycloak_1.config);
                }
                else {
                    console.info('refreshing token');
                    var params = new http_1.URLSearchParams();
                    params.set('grant_type', 'refresh_token');
                    params.set('refresh_token', Keycloak_1.refreshToken);
                    var url = Keycloak_1.getRealmUrl() + '/protocol/openid-connect/token';
                    console.info('getting url');
                    var headers = new http_1.Headers({ 'Content-type': 'application/x-www-form-urlencoded' });
                    if (Keycloak_1.clientId && Keycloak_1.clientSecret) {
                        headers.append('Authorization', 'Basic ' + btoa(Keycloak_1.clientId + ': ' + Keycloak_1.clientSecret));
                    }
                    else {
                        params.set('client_id', _this.clientId);
                    }
                    var timeLocal_1 = new Date().getTime();
                    var options = { headers: headers, withCredentials: true };
                    console.info('calling url ' + url);
                    _this.http.post(url, params, options).subscribe(function (token) {
                        timeLocal_1 = (timeLocal_1 + new Date().getTime()) / 2;
                        var tokenResponse = token.json();
                        console.info('parsed access token ' + tokenResponse['access_token']);
                        Keycloak_1.setToken(tokenResponse['access_token'], tokenResponse['refresh_token'], tokenResponse['id_token'], true);
                        Keycloak_1.timeSkew = Math.floor(timeLocal_1 / 1000) - Keycloak_1.tokenParsed.iat;
                        observer.next(tokenResponse['access_token']);
                    });
                }
            }
        });
    };
    Keycloak.register = function (options) {
        return Keycloak_1.adapter.register(options);
    };
    Keycloak.accountManagement = function () {
        return Keycloak_1.adapter.accountManagement();
    };
    Keycloak.loadUserProfile = function () {
        var url = Keycloak_1.getRealmUrl() + '/account';
        var headers = new http_1.Headers({ 'Accept': 'application/json', 'Authorization': 'bearer ' + Keycloak_1.accessToken });
        var options = { headers: headers };
        return Keycloak_1.http.get(url, options).map(function (profile) { return profile.json(); });
    };
    Keycloak.loadUserInfo = function () {
        var url = Keycloak_1.getRealmUrl() + '/protocol/openid-connect/userinfo';
        var headers = new http_1.Headers({ 'Accept': 'application/json', 'Authorization': 'bearer ' + Keycloak_1.accessToken });
        var options = { headers: headers };
        return Keycloak_1.http.get(url, options).map(function (profile) { return profile; });
    };
    Keycloak.hasRealmRole = function (role) {
        var access = Keycloak_1.realmAccess;
        return !!access && access.roles.indexOf(role) >= 0;
    };
    Keycloak.hasResourceRole = function (role, resource) {
        if (!Keycloak_1.resourceAccess) {
            return false;
        }
        var access = Keycloak_1.resourceAccess[resource || Keycloak_1.clientId];
        return !!access && access.roles.indexOf(role) >= 0;
    };
    Keycloak.isTokenExpired = function (minValidity) {
        if (!Keycloak_1.tokenParsed || (!Keycloak_1.refreshToken && Keycloak_1.flow !== 'implicit')) {
            throw 'Not authenticated';
        }
        var expiresIn = Keycloak_1.tokenParsed['exp'] - (new Date().getTime() / 1000) + Keycloak_1.timeSkew;
        if (minValidity) {
            expiresIn -= minValidity;
        }
        return expiresIn < 0;
    };
    Keycloak.isRefreshTokenExpired = function (minValidity) {
        if (!Keycloak_1.tokenParsed || (!Keycloak_1.refreshToken && Keycloak_1.flow !== 'implicit')) {
            throw 'Not authenticated';
        }
        var expiresIn = Keycloak_1.refreshTokenParsed['exp'] - (new Date().getTime() / 1000) + Keycloak_1.timeSkew;
        if (minValidity) {
            expiresIn -= minValidity;
        }
        return expiresIn < 0;
    };
    Keycloak.clearToken = function (initOptions) {
        if (Keycloak_1.accessToken) {
            Keycloak_1.setToken(null, null, null, true);
            Keycloak_1.authenticatedBehaviourSubject.next(false);
            if (Keycloak_1.loginRequired) {
                Keycloak_1.login(initOptions);
            }
        }
    };
    // URLs methods
    Keycloak.createLoginUrl = function (options) {
        var state = keycloak_utils_UUID_1.UUID.createUUID();
        var nonce = keycloak_utils_UUID_1.UUID.createUUID();
        var redirectUri = Keycloak_1.adapter.redirectUri(options);
        if (options && options.prompt) {
            redirectUri += (redirectUri.indexOf('?') === -1 ? '?' : '&') + 'prompt=' + options.prompt;
        }
        Keycloak_1.callbackStorage.add({ state: state, nonce: nonce, redirectUri: redirectUri });
        var action = 'auth';
        if (options && options.action === 'register') {
            action = 'registrations';
        }
        var scope = (options && options.scope) ? 'openid ' + options.scope : 'openid';
        var url = Keycloak_1.getRealmUrl()
            + '/protocol/openid-connect/' + action
            + '?client_id=' + encodeURIComponent(Keycloak_1.clientId)
            + '&redirect_uri=' + encodeURIComponent(redirectUri)
            + '&state=' + encodeURIComponent(state)
            + '&nonce=' + encodeURIComponent(nonce)
            + '&response_mode=' + encodeURIComponent(Keycloak_1.responseMode)
            + '&response_type=' + encodeURIComponent(Keycloak_1.responseType)
            + '&scope=' + encodeURIComponent(scope);
        if (options && options.prompt) {
            url += '&prompt=' + encodeURIComponent(options.prompt);
        }
        if (options && options.maxAge) {
            url += '&max_age=' + encodeURIComponent(options.maxAge);
        }
        if (options && options.loginHint) {
            url += '&login_hint=' + encodeURIComponent(options.loginHint);
        }
        if (options && options.idpHint) {
            url += '&kc_idp_hint=' + encodeURIComponent(options.idpHint);
        }
        if (options && options.locale) {
            url += '&ui_locales=' + encodeURIComponent(options.locale);
        }
        return url;
    };
    Keycloak.createLogoutUrl = function (options) {
        var url = Keycloak_1.getRealmUrl()
            + '/protocol/openid-connect/logout'
            + '?redirect_uri=' + encodeURIComponent(Keycloak_1.adapter.redirectUri(options, false));
        return url;
    };
    Keycloak.createRegisterUrl = function (options) {
        if (!options) {
            options = {};
        }
        options.action = 'register';
        return Keycloak_1.createLoginUrl(options);
    };
    Keycloak.createAccountUrl = function (options) {
        var url = Keycloak_1.getRealmUrl()
            + '/account'
            + '?referrer=' + encodeURIComponent(Keycloak_1.clientId)
            + '&referrer_uri=' + encodeURIComponent(Keycloak_1.adapter.redirectUri(options));
        return url;
    };
    Keycloak.getRealmUrl = function () {
        if (Keycloak_1.authServerUrl.charAt(Keycloak_1.authServerUrl.length - 1) === '/') {
            return Keycloak_1.authServerUrl + 'realms/' + encodeURIComponent(Keycloak_1.realm);
        }
        else {
            return Keycloak_1.authServerUrl + '/realms/' + encodeURIComponent(Keycloak_1.realm);
        }
    };
    Keycloak.checkLoginIframe = function () {
        return new Rx_1.Observable(function (observer) {
            if (Keycloak_1.loginIframe.iframe && Keycloak_1.loginIframe.iframeOrigin) {
                var msg = Keycloak_1.clientId + ' ' + Keycloak_1.sessionId;
                // Keycloak.loginIframe.callbackMap[Keycloak.clientId] = observer;
                var origin = Keycloak_1.loginIframe.iframeOrigin;
                Keycloak_1.loginIframe.iframe.contentWindow.postMessage(msg, origin);
                observer.next(true);
            }
            else {
                // promise.setSuccess();
                observer.next(false);
            }
        });
    };
    Keycloak.processCallback = function (oauth) {
        var code = oauth.code;
        var error = oauth.error;
        var prompt = oauth.prompt;
        var timeLocal = new Date().getTime();
        if (error) {
            if (prompt !== 'none') {
                var errorData = { error: error, error_description: oauth.error_description };
                Keycloak_1.authErrorBehaviourSubject.next(errorData);
            }
            return;
        }
        else if ((Keycloak_1.flow !== 'standard') && (oauth.access_token || oauth.id_token)) {
            authSuccess(oauth.access_token, null, oauth.id_token, true);
        }
        if ((Keycloak_1.flow !== 'implicit') && code) {
            var url = Keycloak_1.getRealmUrl() + '/protocol/openid-connect/token';
            var params = new http_1.URLSearchParams();
            params.set('code', code);
            params.set('grant_type', 'authorization_code');
            var headers = new http_1.Headers({ 'Content-type': 'application/x-www-form-urlencoded' });
            if (Keycloak_1.clientId && Keycloak_1.clientSecret) {
                headers.append('Authorization', 'Basic ' + btoa(Keycloak_1.clientId + ':' + Keycloak_1.clientSecret));
            }
            else {
                params.set('client_id', Keycloak_1.clientId);
            }
            params.set('redirect_uri', oauth.redirectUri);
            var options = { headers: headers, withCredentials: true };
            this.http.post(url, params, options).subscribe(function (token) {
                var tokenResponse = token.json();
                authSuccess(tokenResponse['access_token'], tokenResponse['refresh_token'], tokenResponse['id_token'], Keycloak_1.flow === 'standard');
            });
        }
        function authSuccess(accessToken, refreshToken, idToken, fulfillPromise) {
            timeLocal = (timeLocal + new Date().getTime()) / 2;
            Keycloak_1.setToken(accessToken, refreshToken, idToken, true);
            if ((Keycloak_1.tokenParsed && Keycloak_1.tokenParsed.nonce !== oauth.storedNonce) ||
                (Keycloak_1.refreshTokenParsed && Keycloak_1.refreshTokenParsed.nonce !== oauth.storedNonce) ||
                (Keycloak_1.idTokenParsed && Keycloak_1.idTokenParsed.nonce !== oauth.storedNonce)) {
                console.log('invalid nonce!');
                Keycloak_1.clearToken({});
            }
            else {
                Keycloak_1.timeSkew = Math.floor(timeLocal / 1000) - Keycloak_1.tokenParsed.iat;
                if (fulfillPromise) {
                    Keycloak_1.authSuccessBehaviourSubject.next(true);
                }
            }
        }
    };
    Keycloak.setToken = function (accessToken, refreshToken, idToken, useTokenTime) {
        if (Keycloak_1.tokenTimeoutHandle) {
            clearTimeout(Keycloak_1.tokenTimeoutHandle);
            Keycloak_1.tokenTimeoutHandle = null;
        }
        if (accessToken) {
            Keycloak_1.accessToken = accessToken;
            Keycloak_1.tokenParsed = keycloak_utils_token_1.Token.decodeToken(accessToken);
            var sessionId = Keycloak_1.realm + '/' + Keycloak_1.tokenParsed.sub;
            if (Keycloak_1.tokenParsed.session_state) {
                sessionId = sessionId + '/' + Keycloak_1.tokenParsed.session_state;
            }
            Keycloak_1.sessionId = sessionId;
            Keycloak_1.authenticatedBehaviourSubject.next(true);
            Keycloak_1.subject = Keycloak_1.tokenParsed.sub;
            Keycloak_1.realmAccess = Keycloak_1.tokenParsed.realm_access;
            Keycloak_1.resourceAccess = Keycloak_1.tokenParsed.resource_access;
            var start = useTokenTime ? Keycloak_1.tokenParsed.iat : (new Date().getTime() / 1000);
            var expiresIn = Keycloak_1.tokenParsed.exp - start;
            Keycloak_1.tokenTimeoutHandle = setTimeout(Keycloak_1.tokenExpiredBehaviourSubject.next(true), expiresIn * 1000);
        }
        else {
            delete Keycloak_1.accessToken;
            delete Keycloak_1.tokenParsed;
            delete Keycloak_1.subject;
            delete Keycloak_1.realmAccess;
            delete Keycloak_1.resourceAccess;
        }
        if (refreshToken) {
            Keycloak_1.refreshToken = refreshToken;
            Keycloak_1.refreshTokenParsed = keycloak_utils_token_1.Token.decodeToken(refreshToken);
        }
        else {
            delete Keycloak_1.refreshToken;
            delete Keycloak_1.refreshTokenParsed;
        }
        if (idToken) {
            Keycloak_1.idToken = idToken;
            Keycloak_1.idTokenParsed = keycloak_utils_token_1.Token.decodeToken(idToken);
        }
        else {
            delete Keycloak_1.idToken;
            delete Keycloak_1.idTokenParsed;
        }
    };
    Keycloak.createCallbackId = function () {
        var id = '<id: ' + (Keycloak_1.callback_id++) + (Math.random()) + '>';
        return id;
    };
    Keycloak.parseCallback = function (url) {
        var oauth = keycloak_utils_URIParser_1.URIParser.parseUri(url, Keycloak_1.responseMode);
        var state = oauth.state;
        var oauthState = Keycloak_1.callbackStorage.get(state);
        if (oauthState && (oauth.code || oauth.error || oauth.access_token || oauth.id_token)) {
            oauth.redirectUri = oauthState.redirectUri;
            oauth.storedNonce = oauthState.nonce;
            if (oauth.fragment) {
                oauth.newUrl += '#' + oauth.fragment;
            }
            return oauth;
        }
    };
    Keycloak.prototype.init = function (initOptions) {
        // should use a better lock
        var _this = this;
        if (!Keycloak_1.initializedBehaviourSubject.getValue()) {
            console.info('KC_CORE: initializing...');
            try {
                Keycloak_1.callbackStorage = new keycloak_storage_local_1.LocalStorage();
            }
            catch (err) {
                Keycloak_1.callbackStorage = new keycloak_storage_cookie_1.CookieStorage();
            }
            if (initOptions && initOptions.adapter === 'cordova') {
                Keycloak_1.adapter = this.loadAdapter('cordova');
            }
            else if (initOptions && initOptions.adapter === 'default') {
                Keycloak_1.adapter = this.loadAdapter('default');
            }
            else {
                if (window['cordova']) {
                    Keycloak_1.adapter = this.loadAdapter('cordova');
                }
                else {
                    Keycloak_1.adapter = this.loadAdapter('default');
                }
            }
            // options processing
            if (initOptions) {
                if (typeof initOptions.checkLoginIframe !== 'undefined') {
                    Keycloak_1.loginIframe.enable = initOptions.checkLoginIframe;
                }
                if (initOptions.checkLoginIframeInterval) {
                    Keycloak_1.loginIframe.interval = initOptions.checkLoginIframeInterval;
                }
                if (initOptions.onLoad === 'login-required') {
                    Keycloak_1.loginRequired = true;
                }
                if (initOptions.responseMode) {
                    if (initOptions.responseMode === 'query' || initOptions.responseMode === 'fragment') {
                        Keycloak_1.responseMode = initOptions.responseMode;
                    }
                    else {
                        throw 'Invalid value for responseMode';
                    }
                }
                if (initOptions.flow) {
                    switch (initOptions.flow) {
                        case 'standard':
                            Keycloak_1.responseType = 'code';
                            break;
                        case 'implicit':
                            Keycloak_1.responseType = 'id_token token';
                            break;
                        case 'hybrid':
                            Keycloak_1.responseType = 'code id_token token';
                            break;
                        default:
                            throw 'Invalid value for flow';
                    }
                    Keycloak_1.flow = initOptions.flow;
                }
            }
            if (!Keycloak_1.responseMode) {
                Keycloak_1.responseMode = 'fragment';
            }
            if (!Keycloak_1.responseType) {
                Keycloak_1.responseType = 'code';
                Keycloak_1.flow = 'standard';
            }
            // loading keycloak conf
            this.loadConfig(Keycloak_1.config).subscribe(function (loaded) {
                if (loaded) {
                    _this.processInit(initOptions).subscribe(function (initialized) {
                        Keycloak_1.initializedBehaviourSubject.next(true);
                    });
                }
            });
        }
    };
    Keycloak.prototype.loadConfig = function (url) {
        return new Rx_1.Observable(function (observer) {
            var configUrl;
            if (!Keycloak_1.config) {
                configUrl = 'keycloak.json';
            }
            else if (typeof Keycloak_1.config === 'string') {
                configUrl = Keycloak_1.config;
            }
            if (configUrl) {
                Keycloak_1.http.get(configUrl).map(function (res) { return res.json(); }).subscribe(function (config) {
                    Keycloak_1.authServerUrl = config['auth-server-url'];
                    Keycloak_1.realm = config['realm'];
                    Keycloak_1.clientId = config['resource'];
                    Keycloak_1.clientSecret = (config['credentials'] || {})['secret'];
                    observer.next(true);
                    // console.info("Keycloak initialized !");
                });
            }
            else {
                if (!Keycloak_1.config['url']) {
                    var scripts = document.getElementsByTagName('script');
                    for (var i = 0; i < scripts.length; i++) {
                        if (scripts[i].src.match(/.*keycloak\.js/)) {
                            Keycloak_1.config.url = scripts[i].src.substr(0, scripts[i].src.indexOf('/js/keycloak.js'));
                            break;
                        }
                    }
                }
                if (!Keycloak_1.config.realm) {
                    throw 'realm missing';
                }
                if (!Keycloak_1.config.clientId) {
                    throw 'clientId missing';
                }
                Keycloak_1.authServerUrl = Keycloak_1.config.url;
                Keycloak_1.realm = Keycloak_1.config.realm;
                Keycloak_1.clientId = Keycloak_1.config.clientId;
                Keycloak_1.clientSecret = (Keycloak_1.config.credentials || {}).secret;
                observer.next(true);
            }
        });
    };
    Keycloak.prototype.processInit = function (initOptions) {
        var _this = this;
        return new Rx_1.Observable(function (observer) {
            var callback = Keycloak_1.parseCallback(window.location.href);
            // let initPromise:any = Keycloak.createPromise;
            if (callback) {
                _this.setupCheckLoginIframe().subscribe(function (setup) {
                    window.history.replaceState({}, null, callback.newUrl);
                    Keycloak_1.processCallback(callback);
                });
            }
            else if (initOptions) {
                if (initOptions.token || initOptions.refreshToken) {
                    Keycloak_1.setToken(initOptions.token, initOptions.refreshToken, initOptions.idToken, false);
                    Keycloak_1.timeSkew = initOptions.timeSkew || 0;
                    if (Keycloak_1.loginIframe.enable) {
                        _this.setupCheckLoginIframe().subscribe(function (setup) {
                            Keycloak_1.checkLoginIframe().subscribe(function (checked) {
                                observer.next(true);
                            });
                        });
                    }
                    else {
                        observer.next(true);
                    }
                }
                else if (initOptions.onLoad) {
                    var options_1 = {};
                    var doLogin_1 = function (prompt) {
                        if (!prompt) {
                            options_1.prompt = 'none';
                        }
                        Keycloak_1.login(options_1);
                    };
                    switch (initOptions.onLoad) {
                        case 'check-sso':
                            console.info('login iframe ? ' + Keycloak_1.loginIframe.enable);
                            if (Keycloak_1.loginIframe.enable) {
                                _this.setupCheckLoginIframe().subscribe(function (setup) {
                                    Keycloak_1.checkLoginIframe().subscribe(function (checked) {
                                        doLogin_1(false);
                                    });
                                });
                            }
                            else {
                                doLogin_1(false);
                            }
                            break;
                        case 'login-required':
                            doLogin_1(true);
                            break;
                        default:
                            throw 'Invalid value for onLoad';
                    }
                }
                else {
                    observer.next(true);
                }
            }
            else {
                observer.next(true);
            }
        });
    };
    Keycloak.prototype.setupCheckLoginIframe = function () {
        return new Rx_1.Observable(function (observer) {
            console.info('setting up login iframe...');
            if (!Keycloak_1.loginIframe.enable) {
                console.info('setting up login iframe ended 1');
                observer.next(true);
                return;
            }
            if (Keycloak_1.loginIframe.iframe) {
                console.info('setting up login iframe ended 2');
                observer.next(true);
            }
            var iframe = document.createElement('iframe');
            Keycloak_1.loginIframe.iframe = iframe;
            var check = function () {
                Keycloak_1.checkLoginIframe().subscribe(function (check) {
                    console.info('iframe checked');
                });
                if (Keycloak_1.accessToken) {
                    setTimeout(check, Keycloak_1.loginIframe.interval * 1000);
                }
            };
            iframe.onload = function () {
                var realmUrl = Keycloak_1.getRealmUrl();
                if (realmUrl.charAt(0) === '/') {
                    var origin = void 0;
                    if (!window.location.origin) {
                        origin = window.location.protocol
                            + '//' + window.location.hostname
                            + (window.location.port ? ': ' + window.location.port : '');
                    }
                    else {
                        origin = window.location.origin;
                    }
                    Keycloak_1.loginIframe.iframeOrigin = origin;
                }
                else {
                    Keycloak_1.loginIframe.iframeOrigin = realmUrl.substring(0, realmUrl.indexOf('/', 8));
                }
                console.info('setting up login iframe ended 3');
                observer.next(true);
                setTimeout(check, Keycloak_1.loginIframe.interval * 1000);
            };
            var src = Keycloak_1.getRealmUrl() + '/protocol/openid-connect/login-status-iframe.html';
            console.info('reloading iframe...' + src);
            iframe.setAttribute('src', src);
            iframe.style.display = 'none';
            document.body.appendChild(iframe);
            var messageCallback = function (event) {
                console.info('checking iframe message callback..' + event.data);
                if (event.origin !== iframe.iframeOrigin) {
                    console.info('setting up login iframe ended 7');
                }
                if (event.origin === iframe.iframeOrigin && event.data !== 'unchanged') {
                    console.info('setting up login iframe ended 6');
                    Keycloak_1.clearToken({});
                }
            };
            window.addEventListener('message', messageCallback, false);
        });
    };
    Keycloak.prototype.loadAdapter = function (type) {
        if (!type || type === 'default') {
            return new keycloak_adapter_default_1.DefaultAdapter();
        }
        if (type === 'cordova') {
            return new keycloak_adapter_cordova_1.CordovaAdapter();
        }
        throw 'invalid adapter type: ' + type;
    };
    return Keycloak;
}());
Keycloak.callback_id = 0;
// Keycloak state subjects
Keycloak.initializedBehaviourSubject = new Rx_1.BehaviorSubject(false);
Keycloak.authenticatedBehaviourSubject = new Rx_1.BehaviorSubject(false);
Keycloak.authSuccessBehaviourSubject = new Rx_1.BehaviorSubject(false);
Keycloak.authErrorBehaviourSubject = new Rx_1.BehaviorSubject({});
Keycloak.tokenExpiredBehaviourSubject = new Rx_1.BehaviorSubject(false);
// Keycloak state observables
Keycloak.initializedObs = Keycloak_1.initializedBehaviourSubject.asObservable();
Keycloak.authenticatedObs = Keycloak_1.authenticatedBehaviourSubject.asObservable();
Keycloak.authSuccessObs = Keycloak_1.authSuccessBehaviourSubject.asObservable();
Keycloak.authErrorObs = Keycloak_1.authErrorBehaviourSubject.asObservable();
Keycloak.tokenExpiredObs = Keycloak_1.tokenExpiredBehaviourSubject.asObservable();
Keycloak = Keycloak_1 = __decorate([
    core_1.Injectable(),
    __metadata("design:paramtypes", [])
], Keycloak);
exports.Keycloak = Keycloak;
var Keycloak_1;
//# sourceMappingURL=keycloak.core.service.js.map