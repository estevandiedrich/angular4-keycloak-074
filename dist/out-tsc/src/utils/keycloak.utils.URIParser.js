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
 * URI parser.
 */
var URIParser = (function () {
    function URIParser() {
    }
    URIParser.initialParse = function (uriToParse, responseMode) {
        var baseUri;
        var queryString;
        var fragmentString;
        var questionMarkIndex = uriToParse.indexOf('?');
        var fragmentIndex = uriToParse.indexOf('#', questionMarkIndex + 1);
        if (questionMarkIndex === -1 && fragmentIndex === -1) {
            baseUri = uriToParse;
        }
        else if (questionMarkIndex !== -1) {
            baseUri = uriToParse.substring(0, questionMarkIndex);
            queryString = uriToParse.substring(questionMarkIndex + 1);
            if (fragmentIndex !== -1) {
                fragmentIndex = queryString.indexOf('#');
                fragmentString = queryString.substring(fragmentIndex + 1);
                queryString = queryString.substring(0, fragmentIndex);
            }
        }
        else {
            baseUri = uriToParse.substring(0, fragmentIndex);
            fragmentString = uriToParse.substring(fragmentIndex + 1);
        }
        return { baseUri: baseUri, queryString: queryString, fragmentString: fragmentString };
    };
    URIParser.parseParams = function (paramString) {
        var result = {};
        var params = paramString.split('&');
        for (var i = 0; i < params.length; i++) {
            var p = params[i].split('=');
            var paramName = decodeURIComponent(p[0]);
            var paramValue = decodeURIComponent(p[1]);
            result[paramName] = paramValue;
        }
        return result;
    };
    URIParser.handleQueryParam = function (paramName, paramValue, oauth) {
        var supportedOAuthParams = ['code', 'state', 'error', 'error_description'];
        for (var i = 0; i < supportedOAuthParams.length; i++) {
            if (paramName === supportedOAuthParams[i]) {
                oauth[paramName] = paramValue;
                return true;
            }
        }
        return false;
    };
    URIParser.parseUri = function (uriToParse, responseMode) {
        var parsedUri = this.initialParse(decodeURIComponent(uriToParse), responseMode);
        var queryParams = {};
        if (parsedUri.queryString) {
            queryParams = this.parseParams(parsedUri.queryString);
        }
        var oauth = { newUrl: parsedUri.baseUri };
        for (var param in queryParams) {
            switch (param) {
                case 'redirect_fragment':
                    oauth.fragment = queryParams[param];
                    break;
                case 'prompt':
                    oauth.prompt = queryParams[param];
                    break;
                default:
                    if (responseMode !== 'query' || !this.handleQueryParam(param, queryParams[param], oauth)) {
                        oauth.newUrl += (oauth.newUrl.indexOf('?') === -1 ? '?' : '&') + param + '=' + queryParams[param];
                    }
                    break;
            }
        }
        if (responseMode === 'fragment') {
            var fragmentParams = {};
            if (parsedUri.fragmentString) {
                fragmentParams = this.parseParams(parsedUri.fragmentString);
            }
            for (var param in fragmentParams) {
                oauth[param] = fragmentParams[param];
            }
        }
        return oauth;
    };
    return URIParser;
}());
exports.URIParser = URIParser;
//# sourceMappingURL=keycloak.utils.URIParser.js.map