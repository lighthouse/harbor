/*
 *  Copyright 2015 Caleb Brose, Chris Fogerty, Rob Sheehy, Zach Taylor, Nick Miller
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

// app.js
// Target application root during production builds.

//
// Application setup
//

// library
var _ = require('lodash');

// app modules
var actions = require('./actions/init'),
    alerts = require('./alerts/init'),
    auth = require('./auth/init'),
    beacons = require('./beacons/init'),
    config = require('./config/init'),
    deploy = require('./deploy/init'),
    docker = require('./docker/init'),
    instances = require('./instances/init'),
    nav = require('./nav/init'),
    roles = require('./roles/init'),
    routes = require('./routes/init'),
    transform = require('./transform/init'),
    users = require('./users/init');

// Initialize the main app
var app = angular.module('lighthouse.app', [
    'flux',
    actions.name,
    alerts.name,
    auth.name,
    beacons.name,
    config.name,
    deploy.name,
    docker.name,
    instances.name,
    nav.name,
    roles.name,
    routes.name,
    transform.name,
    users.name
]);

// $http interceptor
// Captures requests and responses before forwarding them to the calling service
function httpInterceptor($q, actions, flux, alertService) {
    'use strict';

    function error(response) {
        return {
            Cause: response.data.Cause || 'unknown',
            Message: response.data.Message || 'An unknown error occured. Please submit a bug report.'
        };
    }

    return {
        'responseError': function (response) {
            if (response.status === 401) {
                // Clears session data and redirects to /login
                flux.dispatch(actions.authLogout);
                alertService.create({
                    message: 'Please provide a valid username and password.',
                    type: 'info'
                });
            }
            else {
                alertService.create({
                    message: error(response).Message,
                    type: 'danger'
                });
            }

            return $q.reject(response);
        }
    };
}

// Configuration
function appConfig($locationProvider, $httpProvider) {
    'use strict';

    $locationProvider.html5Mode(true);
    $httpProvider.interceptors.push('httpInterceptor');
}

// Initialization
function appInit($location, $rootScope, $window, actions, alertService, authService, sessionService, appModel, flux) {
    'use strict';

    // Confirm auth status with the mothership
    if ($window.user && $window.user.email) {
        flux.dispatch(actions.authLogin, $window.user);

        authService.currentUser($window.user.email);

        // Reload previous page, if any
        var route = sessionService.get('lighthouse.route');
        if (route) {
            flux.dispatch(actions.routeChange, route);
        }
    }
    else {
        flux.dispatch(actions.routeChange, '/login');
    }

    // Route change handling
    $rootScope.$on('$locationChangeStart', function () {
        // Do not allow alerts to persist across page navigation
        flux.dispatch(actions.routeChange, $location.path());
        alertService.clear();
    });
}

httpInterceptor.$inject = ['$q', 'actions', 'flux', 'alertService'];
appConfig.$inject = ['$locationProvider', '$httpProvider'];
appInit.$inject = ['$location', '$rootScope', '$window', 'actions', 'alertService', 'authService', 'sessionService', 'appModel', 'flux'];

// Prepare app state
var appModel = require('./appModel');
app.store('appModel', appModel);
app.factory('httpInterceptor', httpInterceptor);

app.config(appConfig);
app.run(appInit);
// Pass control to angular
angular.bootstrap(document, [app.name]);
