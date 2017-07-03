"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var http_1 = require("@angular/http");
var keycloak_core_service_1 = require("./services/keycloak.core.service");
var keycloak_auth_service_1 = require("./services/keycloak.auth.service");
var keycloak_http_service_1 = require("./services/keycloak.http.service");
function keycloakHttpFactory(backend, defaultOptions, keycloakAuth, keycloak) {
    return new keycloak_http_service_1.KeycloakHttp(backend, defaultOptions, keycloak, keycloakAuth);
}
exports.keycloakHttpFactory = keycloakHttpFactory;
var Ng2KeycloakModule = (function () {
    function Ng2KeycloakModule() {
    }
    return Ng2KeycloakModule;
}());
Ng2KeycloakModule.decorators = [
    { type: core_1.NgModule, args: [{
                imports: [http_1.HttpModule],
                declarations: [],
                providers: [keycloak_core_service_1.Keycloak, keycloak_auth_service_1.KeycloakAuthorization, keycloak_http_service_1.KeycloakHttp,
                    { provide: http_1.Http,
                        useFactory: keycloakHttpFactory,
                        deps: [http_1.XHRBackend, http_1.RequestOptions, keycloak_core_service_1.Keycloak, keycloak_auth_service_1.KeycloakAuthorization]
                    }],
                exports: []
            },] },
];
/** @nocollapse */
Ng2KeycloakModule.ctorParameters = function () { return []; };
exports.Ng2KeycloakModule = Ng2KeycloakModule;
//# sourceMappingURL=ng2-keycloak.module.js.map