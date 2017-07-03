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
 * Default adapter for web browsers
 */
var DefaultAdapter = (function () {
    function DefaultAdapter() {
    }
    DefaultAdapter.prototype.login = function (options) {
        window.location.href = keycloak_core_service_1.Keycloak.createLoginUrl(options);
    };
    DefaultAdapter.prototype.logout = function (options) {
        window.location.href = keycloak_core_service_1.Keycloak.createLogoutUrl(options);
    };
    DefaultAdapter.prototype.register = function (options) {
        window.location.href = keycloak_core_service_1.Keycloak.createRegisterUrl(options);
    };
    DefaultAdapter.prototype.accountManagement = function () {
        window.location.href = keycloak_core_service_1.Keycloak.createAccountUrl({});
    };
    DefaultAdapter.prototype.redirectUri = function (options, encodeHash) {
        if (arguments.length === 1) {
            encodeHash = true;
        }
        if (options && options.redirectUri) {
            return options.redirectUri;
        }
        else {
            var redirectUri = location.href;
            if (location.hash && encodeHash) {
                redirectUri = redirectUri.substring(0, location.href.indexOf('#'));
                redirectUri += (redirectUri.indexOf('?') === -1 ? '?' : '&') + 'redirect_fragment=' +
                    encodeURIComponent(location.hash.substring(1));
            }
            return redirectUri;
        }
    };
    return DefaultAdapter;
}());
exports.DefaultAdapter = DefaultAdapter;
//# sourceMappingURL=keycloak.adapter.default.js.map