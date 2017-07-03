"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var protractor_1 = require("protractor");
var DataServicePage = (function () {
    function DataServicePage() {
    }
    DataServicePage.prototype.navigateTo = function () {
        return protractor_1.browser.get('/');
    };
    DataServicePage.prototype.getParagraphText = function () {
        return protractor_1.element(protractor_1.by.css('app-root h1')).getText();
    };
    return DataServicePage;
}());
exports.DataServicePage = DataServicePage;
//# sourceMappingURL=app.po.js.map