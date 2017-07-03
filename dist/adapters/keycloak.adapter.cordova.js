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
var keycloak_core_service_1 = require("../services/keycloak.core.service");
/**
 * Cordova adapter for hybrid apps.
 */
var CordovaAdapter = (function () {
    function CordovaAdapter() {
    }
    CordovaAdapter.openBrowserTab = function (url, options) {
        var cordova = window.cordova;
        if (options.toolbarColor) {
            cordova.plugins.browsertab.themeable.openUrl(url, options);
        }
        else {
            cordova.plugins.browsertab.themeable.openUrl(url);
        }
        ;
    };
    CordovaAdapter.prototype.login = function (options) {
        //let promise = Keycloak.createPromise();
        var o = 'location=no';
        if (options && options.prompt === 'none') {
            o += ',hidden=yes';
        }
        var loginUrl = keycloak_core_service_1.Keycloak.createLoginUrl(options);
        console.info('opening login frame from cordova: ' + loginUrl);
        if (!window.cordova) {
            throw new Error('Cannot authenticate via a web browser');
        }
        if (!window.cordova.InAppBrowser || !window.cordova.plugins.browsertab) {
            throw new Error('The Apache Cordova InAppBrowser/BrowserTab plugins was not found and are required');
        }
        var ref;
        //let ref = window.cordova.InAppBrowser.open(loginUrl, '_blank', o);
        //let ref = window.cordova.InAppBrowser.open(loginUrl, '_system', o);
        var completed = false;
        window.cordova.plugins.browsertab.themeable.isAvailable(function (result) {
            if (!result) {
                ref = window.cordova.InAppBrowser.open(loginUrl, '_system');
                ref.addEventListener('loadstart', function (event) {
                    if (event.url.indexOf('http://localhost') === 0) {
                        var callback = keycloak_core_service_1.Keycloak.parseCallback(event.url);
                        keycloak_core_service_1.Keycloak.processCallback(callback);
                        ref.close();
                        completed = true;
                    }
                });
                ref.addEventListener('loaderror', function (event) {
                    if (!completed) {
                        if (event.url.indexOf('http://localhost') === 0) {
                            var callback = keycloak_core_service_1.Keycloak.parseCallback(event.url);
                            keycloak_core_service_1.Keycloak.processCallback(callback);
                            ref.close();
                            completed = true;
                        }
                        else {
                            ref.close();
                        }
                    }
                });
            }
            else {
                CordovaAdapter.openBrowserTab(loginUrl, options);
            }
        }, function (isAvailableError) {
            console.info('failed to query availability of in-app browser tab');
        });
    };
    CordovaAdapter.prototype.closeBrowserTab = function () {
        var cordova = window.cordova;
        cordova.plugins.browsertab.themeable.close();
        //completed = true;
    };
    CordovaAdapter.prototype.logout = function (options) {
        var cordova = window.cordova;
        var logoutUrl = keycloak_core_service_1.Keycloak.createLogoutUrl(options);
        var ref;
        var error;
        cordova.plugins.browsertab.themeable.isAvailable(function (result) {
            if (!result) {
                ref = cordova.InAppBrowser.open(logoutUrl, '_system');
                ref.addEventListener('loadstart', function (event) {
                    if (event.url.indexOf('http://localhost') === 0) {
                        this.ref.close();
                    }
                });
                ref.addEventListener('loaderror', function (event) {
                    if (event.url.indexOf('http://localhost') === 0) {
                        this.ref.close();
                    }
                    else {
                        error = true;
                        this.ref.close();
                    }
                });
                ref.addEventListener('exit', function (event) {
                    if (error) {
                        //promise.setError();
                    }
                    else {
                        keycloak_core_service_1.Keycloak.clearToken({});
                        //promise.setSuccess();
                    }
                });
            }
            else {
                CordovaAdapter.openBrowserTab(logoutUrl, options);
            }
        }, function (isAvailableError) {
            console.info('failed to query availability of in-app browser tab');
        });
    };
    CordovaAdapter.prototype.register = function (options) {
        var registerUrl = keycloak_core_service_1.Keycloak.createRegisterUrl({});
        window.cordova.plugins.browsertab.themeable.isAvailable(function (result) {
            if (!result) {
                window.cordova.InAppBrowser.open(registerUrl, '_system');
            }
            else {
                CordovaAdapter.openBrowserTab(registerUrl, options);
            }
        }, function (isAvailableError) {
            console.info('failed to query availability of in-app browser tab');
        });
    };
    CordovaAdapter.prototype.accountManagement = function (options) {
        var accountUrl = keycloak_core_service_1.Keycloak.createAccountUrl({});
        window.cordova.plugins.browsertab.themeable.isAvailable(function (result) {
            if (!result) {
                window.cordova.InAppBrowser.open(accountUrl, '_system');
            }
            else {
                CordovaAdapter.openBrowserTab(accountUrl, options);
            }
        }, function (isAvailableError) {
            console.info('failed to query availability of in-app browser tab');
        });
    };
    CordovaAdapter.prototype.redirectUri = function (options) {
        if (options.redirectUri) {
            return options.redirectUri;
        }
        else {
            return 'http://localhost';
        }
    };
    return CordovaAdapter;
}());
exports.CordovaAdapter = CordovaAdapter;
//# sourceMappingURL=keycloak.adapter.cordova.js.map