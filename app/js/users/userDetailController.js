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

function userDetailController($scope, $routeParams, flux, userModel, userService) {
    'use strict';

    // init
    $scope.user = {email: $routeParams.email};

    userService.getUser($scope.user.email);

    // State event listeners
    $scope.$listenTo(userModel, function (){
        $scope.user = userModel.getUser();
    });
}

userDetailController.$inject = ['$scope', '$routeParams', 'flux', 'userModel', 'userService'];
module.exports = userDetailController;
