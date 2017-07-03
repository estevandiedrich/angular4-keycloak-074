(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(factory());
}(this, (function () { 'use strict';

Object.defineProperty(exports, "__esModule", { value: true });
var keycloak_core_service_1 = require("./services/keycloak.core.service");
exports.Keycloak = keycloak_core_service_1.Keycloak;
var keycloak_http_service_1 = require("./services/keycloak.http.service");
exports.KeycloakHttp = keycloak_http_service_1.KeycloakHttp;
var keycloak_auth_service_1 = require("./services/keycloak.auth.service");
exports.KeycloakAuthorization = keycloak_auth_service_1.KeycloakAuthorization;
var ng2_keycloak_module_1 = require("./ng2-keycloak.module");
exports.Ng2KeycloakModule = ng2_keycloak_module_1.Ng2KeycloakModule;

})));
