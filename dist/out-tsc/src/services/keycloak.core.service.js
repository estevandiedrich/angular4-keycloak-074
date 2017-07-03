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
var Keycloak = (function () {
    // public constructor
    function Keycloak() {
        Keycloak.loginIframe = new keycloak_utils_loginIframe_1.LoginIframe(true, [], 5);
    }
    // Keycloak methods
    Keycloak.login = function (options) {
        return Keycloak.adapter.login(options);
    };
    Keycloak.logout = function (options) {
        return Keycloak.adapter.logout(options);
    };
    Keycloak.updateToken = function (minValidity) {
        var _this = this;
        return new Rx_1.Observable(function (observer) {
            minValidity = minValidity || 5;
            if (!Keycloak.isTokenExpired(minValidity)) {
                console.info('token still valid');
                observer.next(Keycloak.accessToken);
            }
            else {
                if (Keycloak.isRefreshTokenExpired(5)) {
                    Keycloak.login(Keycloak.config);
                }
                else {
                    console.info('refreshing token');
                    var params = new http_1.URLSearchParams();
                    params.set('grant_type', 'refresh_token');
                    params.set('refresh_token', Keycloak.refreshToken);
                    var url = Keycloak.getRealmUrl() + '/protocol/openid-connect/token';
                    console.info('getting url');
                    var headers = new http_1.Headers({ 'Content-type': 'application/x-www-form-urlencoded' });
                    if (Keycloak.clientId && Keycloak.clientSecret) {
                        headers.append('Authorization', 'Basic ' + btoa(Keycloak.clientId + ': ' + Keycloak.clientSecret));
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
                        Keycloak.setToken(tokenResponse['access_token'], tokenResponse['refresh_token'], tokenResponse['id_token'], true);
                        Keycloak.timeSkew = Math.floor(timeLocal_1 / 1000) - Keycloak.tokenParsed.iat;
                        observer.next(tokenResponse['access_token']);
                    });
                }
            }
        });
    };
    Keycloak.register = function (options) {
        return Keycloak.adapter.register(options);
    };
    Keycloak.accountManagement = function () {
        return Keycloak.adapter.accountManagement();
    };
    Keycloak.loadUserProfile = function () {
        var url = Keycloak.getRealmUrl() + '/account';
        var headers = new http_1.Headers({ 'Accept': 'application/json', 'Authorization': 'bearer ' + Keycloak.accessToken });
        var options = { headers: headers };
        return Keycloak.http.get(url, options).map(function (profile) { return profile.json(); });
    };
    Keycloak.loadUserInfo = function () {
        var url = Keycloak.getRealmUrl() + '/protocol/openid-connect/userinfo';
        var headers = new http_1.Headers({ 'Accept': 'application/json', 'Authorization': 'bearer ' + Keycloak.accessToken });
        var options = { headers: headers };
        return Keycloak.http.get(url, options).map(function (profile) { return profile; });
    };
    Keycloak.hasRealmRole = function (role) {
        var access = Keycloak.realmAccess;
        return !!access && access.roles.indexOf(role) >= 0;
    };
    Keycloak.hasResourceRole = function (role, resource) {
        if (!Keycloak.resourceAccess) {
            return false;
        }
        var access = Keycloak.resourceAccess[resource || Keycloak.clientId];
        return !!access && access.roles.indexOf(role) >= 0;
    };
    Keycloak.isTokenExpired = function (minValidity) {
        if (!Keycloak.tokenParsed || (!Keycloak.refreshToken && Keycloak.flow !== 'implicit')) {
            throw 'Not authenticated';
        }
        var expiresIn = Keycloak.tokenParsed['exp'] - (new Date().getTime() / 1000) + Keycloak.timeSkew;
        if (minValidity) {
            expiresIn -= minValidity;
        }
        return expiresIn < 0;
    };
    Keycloak.isRefreshTokenExpired = function (minValidity) {
        if (!Keycloak.tokenParsed || (!Keycloak.refreshToken && Keycloak.flow !== 'implicit')) {
            throw 'Not authenticated';
        }
        var expiresIn = Keycloak.refreshTokenParsed['exp'] - (new Date().getTime() / 1000) + Keycloak.timeSkew;
        if (minValidity) {
            expiresIn -= minValidity;
        }
        return expiresIn < 0;
    };
    Keycloak.clearToken = function (initOptions) {
        if (Keycloak.accessToken) {
            Keycloak.setToken(null, null, null, true);
            Keycloak.authenticatedBehaviourSubject.next(false);
            if (Keycloak.loginRequired) {
                Keycloak.login(initOptions);
            }
        }
    };
    // URLs methods
    Keycloak.createLoginUrl = function (options) {
        var state = keycloak_utils_UUID_1.UUID.createUUID();
        var nonce = keycloak_utils_UUID_1.UUID.createUUID();
        var redirectUri = Keycloak.adapter.redirectUri(options);
        if (options && options.prompt) {
            redirectUri += (redirectUri.indexOf('?') === -1 ? '?' : '&') + 'prompt=' + options.prompt;
        }
        Keycloak.callbackStorage.add({ state: state, nonce: nonce, redirectUri: redirectUri });
        var action = 'auth';
        if (options && options.action === 'register') {
            action = 'registrations';
        }
        var scope = (options && options.scope) ? 'openid ' + options.scope : 'openid';
        var url = Keycloak.getRealmUrl()
            + '/protocol/openid-connect/' + action
            + '?client_id=' + encodeURIComponent(Keycloak.clientId)
            + '&redirect_uri=' + encodeURIComponent(redirectUri)
            + '&state=' + encodeURIComponent(state)
            + '&nonce=' + encodeURIComponent(nonce)
            + '&response_mode=' + encodeURIComponent(Keycloak.responseMode)
            + '&response_type=' + encodeURIComponent(Keycloak.responseType)
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
        var url = Keycloak.getRealmUrl()
            + '/protocol/openid-connect/logout'
            + '?redirect_uri=' + encodeURIComponent(Keycloak.adapter.redirectUri(options, false));
        return url;
    };
    Keycloak.createRegisterUrl = function (options) {
        if (!options) {
            options = {};
        }
        options.action = 'register';
        return Keycloak.createLoginUrl(options);
    };
    Keycloak.createAccountUrl = function (options) {
        var url = Keycloak.getRealmUrl()
            + '/account'
            + '?referrer=' + encodeURIComponent(Keycloak.clientId)
            + '&referrer_uri=' + encodeURIComponent(Keycloak.adapter.redirectUri(options));
        return url;
    };
    Keycloak.getRealmUrl = function () {
        if (Keycloak.authServerUrl.charAt(Keycloak.authServerUrl.length - 1) === '/') {
            return Keycloak.authServerUrl + 'realms/' + encodeURIComponent(Keycloak.realm);
        }
        else {
            return Keycloak.authServerUrl + '/realms/' + encodeURIComponent(Keycloak.realm);
        }
    };
    Keycloak.checkLoginIframe = function () {
        return new Rx_1.Observable(function (observer) {
            if (Keycloak.loginIframe.iframe && Keycloak.loginIframe.iframeOrigin) {
                var msg = Keycloak.clientId + ' ' + Keycloak.sessionId;
                // Keycloak.loginIframe.callbackMap[Keycloak.clientId] = observer;
                var origin = Keycloak.loginIframe.iframeOrigin;
                Keycloak.loginIframe.iframe.contentWindow.postMessage(msg, origin);
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
                Keycloak.authErrorBehaviourSubject.next(errorData);
            }
            return;
        }
        else if ((Keycloak.flow !== 'standard') && (oauth.access_token || oauth.id_token)) {
            authSuccess(oauth.access_token, null, oauth.id_token, true);
        }
        if ((Keycloak.flow !== 'implicit') && code) {
            var url = Keycloak.getRealmUrl() + '/protocol/openid-connect/token';
            var params = new http_1.URLSearchParams();
            params.set('code', code);
            params.set('grant_type', 'authorization_code');
            var headers = new http_1.Headers({ 'Content-type': 'application/x-www-form-urlencoded' });
            if (Keycloak.clientId && Keycloak.clientSecret) {
                headers.append('Authorization', 'Basic ' + btoa(Keycloak.clientId + ':' + Keycloak.clientSecret));
            }
            else {
                params.set('client_id', Keycloak.clientId);
            }
            params.set('redirect_uri', oauth.redirectUri);
            var options = { headers: headers, withCredentials: true };
            this.http.post(url, params, options).subscribe(function (token) {
                var tokenResponse = token.json();
                authSuccess(tokenResponse['access_token'], tokenResponse['refresh_token'], tokenResponse['id_token'], Keycloak.flow === 'standard');
            });
        }
        function authSuccess(accessToken, refreshToken, idToken, fulfillPromise) {
            timeLocal = (timeLocal + new Date().getTime()) / 2;
            Keycloak.setToken(accessToken, refreshToken, idToken, true);
            if ((Keycloak.tokenParsed && Keycloak.tokenParsed.nonce !== oauth.storedNonce) ||
                (Keycloak.refreshTokenParsed && Keycloak.refreshTokenParsed.nonce !== oauth.storedNonce) ||
                (Keycloak.idTokenParsed && Keycloak.idTokenParsed.nonce !== oauth.storedNonce)) {
                console.log('invalid nonce!');
                Keycloak.clearToken({});
            }
            else {
                Keycloak.timeSkew = Math.floor(timeLocal / 1000) - Keycloak.tokenParsed.iat;
                if (fulfillPromise) {
                    Keycloak.authSuccessBehaviourSubject.next(true);
                }
            }
        }
    };
    Keycloak.setToken = function (accessToken, refreshToken, idToken, useTokenTime) {
        if (Keycloak.tokenTimeoutHandle) {
            clearTimeout(Keycloak.tokenTimeoutHandle);
            Keycloak.tokenTimeoutHandle = null;
        }
        if (accessToken) {
            Keycloak.accessToken = accessToken;
            Keycloak.tokenParsed = keycloak_utils_token_1.Token.decodeToken(accessToken);
            var sessionId = Keycloak.realm + '/' + Keycloak.tokenParsed.sub;
            if (Keycloak.tokenParsed.session_state) {
                sessionId = sessionId + '/' + Keycloak.tokenParsed.session_state;
            }
            Keycloak.sessionId = sessionId;
            Keycloak.authenticatedBehaviourSubject.next(true);
            Keycloak.subject = Keycloak.tokenParsed.sub;
            Keycloak.realmAccess = Keycloak.tokenParsed.realm_access;
            Keycloak.resourceAccess = Keycloak.tokenParsed.resource_access;
            var start = useTokenTime ? Keycloak.tokenParsed.iat : (new Date().getTime() / 1000);
            var expiresIn = Keycloak.tokenParsed.exp - start;
            Keycloak.tokenTimeoutHandle = setTimeout(Keycloak.tokenExpiredBehaviourSubject.next(true), expiresIn * 1000);
        }
        else {
            delete Keycloak.accessToken;
            delete Keycloak.tokenParsed;
            delete Keycloak.subject;
            delete Keycloak.realmAccess;
            delete Keycloak.resourceAccess;
        }
        if (refreshToken) {
            Keycloak.refreshToken = refreshToken;
            Keycloak.refreshTokenParsed = keycloak_utils_token_1.Token.decodeToken(refreshToken);
        }
        else {
            delete Keycloak.refreshToken;
            delete Keycloak.refreshTokenParsed;
        }
        if (idToken) {
            Keycloak.idToken = idToken;
            Keycloak.idTokenParsed = keycloak_utils_token_1.Token.decodeToken(idToken);
        }
        else {
            delete Keycloak.idToken;
            delete Keycloak.idTokenParsed;
        }
    };
    Keycloak.createCallbackId = function () {
        var id = '<id: ' + (Keycloak.callback_id++) + (Math.random()) + '>';
        return id;
    };
    Keycloak.parseCallback = function (url) {
        var oauth = keycloak_utils_URIParser_1.URIParser.parseUri(url, Keycloak.responseMode);
        var state = oauth.state;
        var oauthState = Keycloak.callbackStorage.get(state);
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
        if (!Keycloak.initializedBehaviourSubject.getValue()) {
            console.info('KC_CORE: initializing...');
            try {
                Keycloak.callbackStorage = new keycloak_storage_local_1.LocalStorage();
            }
            catch (err) {
                Keycloak.callbackStorage = new keycloak_storage_cookie_1.CookieStorage();
            }
            if (initOptions && initOptions.adapter === 'cordova') {
                Keycloak.adapter = this.loadAdapter('cordova');
            }
            else if (initOptions && initOptions.adapter === 'default') {
                Keycloak.adapter = this.loadAdapter('default');
            }
            else {
                if (window['cordova']) {
                    Keycloak.adapter = this.loadAdapter('cordova');
                }
                else {
                    Keycloak.adapter = this.loadAdapter('default');
                }
            }
            // options processing
            if (initOptions) {
                if (typeof initOptions.checkLoginIframe !== 'undefined') {
                    Keycloak.loginIframe.enable = initOptions.checkLoginIframe;
                }
                if (initOptions.checkLoginIframeInterval) {
                    Keycloak.loginIframe.interval = initOptions.checkLoginIframeInterval;
                }
                if (initOptions.onLoad === 'login-required') {
                    Keycloak.loginRequired = true;
                }
                if (initOptions.responseMode) {
                    if (initOptions.responseMode === 'query' || initOptions.responseMode === 'fragment') {
                        Keycloak.responseMode = initOptions.responseMode;
                    }
                    else {
                        throw 'Invalid value for responseMode';
                    }
                }
                if (initOptions.flow) {
                    switch (initOptions.flow) {
                        case 'standard':
                            Keycloak.responseType = 'code';
                            break;
                        case 'implicit':
                            Keycloak.responseType = 'id_token token';
                            break;
                        case 'hybrid':
                            Keycloak.responseType = 'code id_token token';
                            break;
                        default:
                            throw 'Invalid value for flow';
                    }
                    Keycloak.flow = initOptions.flow;
                }
            }
            if (!Keycloak.responseMode) {
                Keycloak.responseMode = 'fragment';
            }
            if (!Keycloak.responseType) {
                Keycloak.responseType = 'code';
                Keycloak.flow = 'standard';
            }
            // loading keycloak conf
            this.loadConfig(Keycloak.config).subscribe(function (loaded) {
                if (loaded) {
                    _this.processInit(initOptions).subscribe(function (initialized) {
                        Keycloak.initializedBehaviourSubject.next(true);
                    });
                }
            });
        }
    };
    Keycloak.prototype.loadConfig = function (url) {
        return new Rx_1.Observable(function (observer) {
            var configUrl;
            if (!Keycloak.config) {
                configUrl = 'keycloak.json';
            }
            else if (typeof Keycloak.config === 'string') {
                configUrl = Keycloak.config;
            }
            if (configUrl) {
                Keycloak.http.get(configUrl).map(function (res) { return res.json(); }).subscribe(function (config) {
                    Keycloak.authServerUrl = config['auth-server-url'];
                    Keycloak.realm = config['realm'];
                    Keycloak.clientId = config['resource'];
                    Keycloak.clientSecret = (config['credentials'] || {})['secret'];
                    observer.next(true);
                    // console.info("Keycloak initialized !");
                });
            }
            else {
                if (!Keycloak.config['url']) {
                    var scripts = document.getElementsByTagName('script');
                    for (var i = 0; i < scripts.length; i++) {
                        if (scripts[i].src.match(/.*keycloak\.js/)) {
                            Keycloak.config.url = scripts[i].src.substr(0, scripts[i].src.indexOf('/js/keycloak.js'));
                            break;
                        }
                    }
                }
                if (!Keycloak.config.realm) {
                    throw 'realm missing';
                }
                if (!Keycloak.config.clientId) {
                    throw 'clientId missing';
                }
                Keycloak.authServerUrl = Keycloak.config.url;
                Keycloak.realm = Keycloak.config.realm;
                Keycloak.clientId = Keycloak.config.clientId;
                Keycloak.clientSecret = (Keycloak.config.credentials || {}).secret;
                observer.next(true);
            }
        });
    };
    Keycloak.prototype.processInit = function (initOptions) {
        var _this = this;
        return new Rx_1.Observable(function (observer) {
            var callback = Keycloak.parseCallback(window.location.href);
            // let initPromise:any = Keycloak.createPromise;
            if (callback) {
                _this.setupCheckLoginIframe().subscribe(function (setup) {
                    window.history.replaceState({}, null, callback.newUrl);
                    Keycloak.processCallback(callback);
                });
            }
            else if (initOptions) {
                if (initOptions.token || initOptions.refreshToken) {
                    Keycloak.setToken(initOptions.token, initOptions.refreshToken, initOptions.idToken, false);
                    Keycloak.timeSkew = initOptions.timeSkew || 0;
                    if (Keycloak.loginIframe.enable) {
                        _this.setupCheckLoginIframe().subscribe(function (setup) {
                            Keycloak.checkLoginIframe().subscribe(function (checked) {
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
                        Keycloak.login(options_1);
                    };
                    switch (initOptions.onLoad) {
                        case 'check-sso':
                            console.info('login iframe ? ' + Keycloak.loginIframe.enable);
                            if (Keycloak.loginIframe.enable) {
                                _this.setupCheckLoginIframe().subscribe(function (setup) {
                                    Keycloak.checkLoginIframe().subscribe(function (checked) {
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
            if (!Keycloak.loginIframe.enable) {
                console.info('setting up login iframe ended 1');
                observer.next(true);
                return;
            }
            if (Keycloak.loginIframe.iframe) {
                console.info('setting up login iframe ended 2');
                observer.next(true);
            }
            var iframe = document.createElement('iframe');
            Keycloak.loginIframe.iframe = iframe;
            var check = function () {
                Keycloak.checkLoginIframe().subscribe(function (check) {
                    console.info('iframe checked');
                });
                if (Keycloak.accessToken) {
                    setTimeout(check, Keycloak.loginIframe.interval * 1000);
                }
            };
            iframe.onload = function () {
                var realmUrl = Keycloak.getRealmUrl();
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
                    Keycloak.loginIframe.iframeOrigin = origin;
                }
                else {
                    Keycloak.loginIframe.iframeOrigin = realmUrl.substring(0, realmUrl.indexOf('/', 8));
                }
                console.info('setting up login iframe ended 3');
                observer.next(true);
                setTimeout(check, Keycloak.loginIframe.interval * 1000);
            };
            var src = Keycloak.getRealmUrl() + '/protocol/openid-connect/login-status-iframe.html';
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
                    Keycloak.clearToken({});
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
Keycloak.initializedObs = Keycloak.initializedBehaviourSubject.asObservable();
Keycloak.authenticatedObs = Keycloak.authenticatedBehaviourSubject.asObservable();
Keycloak.authSuccessObs = Keycloak.authSuccessBehaviourSubject.asObservable();
Keycloak.authErrorObs = Keycloak.authErrorBehaviourSubject.asObservable();
Keycloak.tokenExpiredObs = Keycloak.tokenExpiredBehaviourSubject.asObservable();
Keycloak.decorators = [
    { type: core_1.Injectable },
];
/** @nocollapse */
Keycloak.ctorParameters = function () { return []; };
exports.Keycloak = Keycloak;
//# sourceMappingURL=keycloak.core.service.js.map