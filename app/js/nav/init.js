
var navController = require('./navController'),
    navDirective = require('./navDirective');

var nav = angular.module('lighthouse.nav', []);

nav.controller('navController', navController);
nav.directive('nav', navDirective);

module.exports = nav;