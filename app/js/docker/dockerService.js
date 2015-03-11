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

/*
 * docker/dockerService.js
 * Main entrypoint for all controllers requesting Docker instance info.
 */

var _ = require('lodash');
var oboe = require('oboe');

function dockerService($http, actions, flux, alertService, configService) {
    'use strict';

    // Utility for creating a Docker endpoint object
    function ep(_verb, _template, _action) {
        return {
            verb: _verb,
            template: _template,
            action: _action
        };
    }

    // Endpoint -> (verb, action)
    var endpoints = {
        'containers': {
            'inspect': ep('GET', '/containers/{id}/json', actions.inspectContainer),
            'create':  ep('POST', '/containers/create', actions.createContainer),
            'list':    ep('GET', '/containers/json', actions.listContainers),
            'start':   ep('POST', '/containers/{id}/start', actions.startContainer),
            'stop':    ep('POST', '/containers/{id}/stop', actions.stopContainer),
            'restart': ep('POST', '/containers/{id}/restart', actions.restartContainer),
            'pause':   ep('POST', '/containers/{id}/pause', actions.pauseContainer),
            'unpause': ep('POST', '/containers/{id}/unpause', actions.unpauseContainer)
        },
        'images': {
            'list':   ep('GET', '/images/json', actions.listImages),
            'search': ep('GET', '/images/search', actions.searchImages),
            'pull':   ep('POST', '/images/create', actions.pullImage)
        }
    };

    /*
     * prepareUrl()
     * @param {string, required} url: docker API call
     * @param {string, required} host: targeted docker instance
     * @param {string} id: container/image id located on host
     */
    function prepareUrl(url, host, id) {
        var request = [configService.api.base, 'd/', encodeURIComponent(host)];

        if (id && (url.indexOf('{id}') > -1)) {
            request.push(url.replace('{id}', id));
        }
        else {
            request.push(url);
        }

        return request.join('');
    }

    /*
     * docker()
     * Main entrypoint.
     * Prepares a Docker request and dispatches the appropriate flux action upon success.
     *
     * @param {string, required} namespace: namespace representation of a Docker API call (i.e. 'containers.inspect')
     * @param {object, required} request: object representation of a Docker API call.
     * Allowed keys:
     *      {string, required} host: lighthouse alias for targeted Docker instance
     *      {string} id: image or container id (generated by Docker)
     *      {object} query: map of query parameter keys and values
     *      {*} data: body data for POST/PUT requests
     */
    function d(namespace, request) {
        var ns = namespace.split('.');
        var endpoint = endpoints[ns[0]][ns[1]];

        var config = {
            method: endpoint.verb,
            url: prepareUrl(endpoint.template, request.host, request.id),
            params: request.query,
            data: request.data ? {'Payload': request.data} : null,
            responseType: 'json',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        $http(config).then(
            // success
            function (response) {
                flux.dispatch(endpoint.action,
                    {'id': request.id, 'host': request.host, 'response': response.data});
            },
            // error
            function (response) {
                alertService.create({
                    message: response.data,
                    type: 'danger'
                });
            }
        );
    }

    function stream(namespace, request) {
        var ns = namespace.split('.');
        var endpoint = endpoints[ns[0]][ns[1]];

        var oboeStream = oboe({
            method: endpoint.verb,
            url: prepareUrl(endpoint.template, request.host, request.id) + '?' + $.param(request.data)
        });

        _.reduce(request.patterns, function(stream, pattern) {
            return stream.node(pattern, function(item) {
                flux.dispatch(endpoint.action, {
                    'id': request.id,
                    'host': request.host,
                    'response': item,
                    'pattern': pattern
                });
            });
        }, oboeStream);
    }

    return {
        'd': d,
        'stream': stream
    };
}

dockerService.$inject = ['$http', 'actions', 'flux', 'alertService', 'configService'];
module.exports = dockerService;
