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
/**
 * To store Keycloak objects like tokens using a cookie.
 */
var CookieStorage = (function () {
    function CookieStorage() {
        this.getCookie = function (key) {
            var name = key + '=';
            var ca = document.cookie.split(';');
            for (var i = 0; i < ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) === ' ') {
                    c = c.substring(1);
                }
                if (c.indexOf(name) === 0) {
                    return c.substring(name.length, c.length);
                }
            }
            return '';
        };
    }
    CookieStorage.prototype.get = function (state) {
        if (!state) {
            return;
        }
        var value = this.getCookie('kc-callback-' + state);
        this.setCookie('kc-callback-' + state, '', this.cookieExpiration(-100));
        if (value) {
            return JSON.parse(value);
        }
    };
    ;
    CookieStorage.prototype.add = function (state) {
        this.setCookie('kc-callback-' + state.state, JSON.stringify(state), this.cookieExpiration(60));
    };
    ;
    CookieStorage.prototype.removeItem = function (key) {
        this.setCookie(key, '', this.cookieExpiration(-100));
    };
    ;
    CookieStorage.prototype.cookieExpiration = function (minutes) {
        var exp = new Date();
        exp.setTime(exp.getTime() + (minutes * 60 * 1000));
        return exp;
    };
    ;
    CookieStorage.prototype.setCookie = function (key, value, expirationDate) {
        var cookie = key + '=' + value + '; '
            + 'expires=' + expirationDate.toUTCString() + '; ';
        document.cookie = cookie;
    };
    return CookieStorage;
}());
exports.CookieStorage = CookieStorage;
//# sourceMappingURL=keycloak.storage.cookie.js.map