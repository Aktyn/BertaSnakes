"use strict";
///<reference path="utils.ts"/>
(function () {
    $$.load(function () {
        $$("#topbar").getChildren('a[href="info"]').addClass('current'); //highlight topbar bookmark
    });
})();
