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
 * To store Keycloak objects like tokens using a localStorage.
 */
var LocalStorage = (function () {
    function LocalStorage() {
    }
    LocalStorage.prototype.clearExpired = function () {
        var time = new Date().getTime();
        for (var i = 1; i <= localStorage.length; i++) {
            var key = localStorage.key(i);
            if (key && key.indexOf('kc-callback-') === 0) {
                var value = localStorage.getItem(key);
                if (value) {
                    try {
                        var expires = JSON.parse(value).expires;
                        if (!expires || expires < time) {
                            localStorage.removeItem(key);
                        }
                    }
                    catch (err) {
                        localStorage.removeItem(key);
                    }
                }
            }
        }
    };
    LocalStorage.prototype.get = function (state) {
        if (!state) {
            return;
        }
        var key = 'kc-callback-' + state;
        var value = localStorage.getItem(key);
        if (value) {
            localStorage.removeItem(key);
            value = JSON.parse(value);
        }
        this.clearExpired();
        return value;
    };
    ;
    LocalStorage.prototype.add = function (state) {
        this.clearExpired();
        var key = 'kc-callback-' + state.state;
        state.expires = new Date().getTime() + (60 * 60 * 1000);
        localStorage.setItem(key, JSON.stringify(state));
    };
    ;
    return LocalStorage;
}());
exports.LocalStorage = LocalStorage;
//# sourceMappingURL=keycloak.storage.local.js.map