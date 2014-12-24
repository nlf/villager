var server;
var Lab = require('lab');
var Code = require('code');
var Hapi = require('hapi');
var Bell = require('bell');
var config = require('./test_config.json');
var handlers = require('../server/handlers');
var Cookie = require('hapi-auth-cookie');
var Dulcimer = require('dulcimer');
Dulcimer.connect({type: 'level', path: './db'});

var lab = exports.lab = Lab.script();
var expect = Code.expect;

lab.experiment('main tests', function () {
    lab.before(function (done) {
        server = new Hapi.Server();

        server.connection({ 
            host: config.hostname, 
            port: config.port 
        });

        server.views({
            engines: { jade: require('jade') },
            path: __dirname + '../../templates'
        });

        server.register([Bell, Cookie], function (err) {

            ////////////////////////////////// AUTH STRATEGY

            server.auth.strategy('twitter', 'bell', {
                provider: 'twitter',
                password: config.auth.twitter.password,
                isSecure: false,
                clientId: config.auth.twitter.clientId,
                clientSecret: config.auth.twitter.clientSecret
            });

            server.auth.strategy('session', 'cookie', {
                password: config.session.cookieOptions.password,
                cookie: 'sid',
                redirectTo: '/login',
                redirectOnTry: false,
                isSecure: false
            });

            ////////////////////////////////// SET UP HANDLERS AND ROUTES

            server.bind(handlers);

            var h = handlers;

            server.ext('onPreHandler', h.addContext);

            ////////////////////////////////// STATIC

            server.route({ method: 'GET', path: '/{path*}',
              handler: { directory: { path: './public', listing: false, index: true } } 
            });

            ////////////////////////////////// HOME 

            server.route({ method: 'GET',  path: '/', config: h.pages.index, });

            ////////////////////////////////// TINKER

            server.route({ method: 'GET',  path: '/tinker', config: h.pages.tinker });
            server.route({ method: 'GET',  path: '/tinker/delete/{categoryType}/{modelSlug}', config: h.categories.delete });
            server.route({ method: 'GET',  path: '/tinker/edit/{categoryType}/{modelSlug}', config: h.categories.edit });
            server.route({ method: 'POST', path: '/tinker/update/{categoryType}/{modelKey}', config: h.categories.update });

            // move these
            server.route({ method: 'POST', path: '/tinker/add-interest', config: h.categories.addInterest });    
            server.route({ method: 'POST', path: '/tinker/add-group-category', config: h.categories.addGroupCategory });
            server.route({ method: 'POST', path: '/tinker/add-place-category', config: h.categories.addPlaceCategory });

            ////////////////////////////////// LISTS

            server.route({ method: 'GET',  path: '/lists', config: h.lists.list });
            server.route({ method: 'POST', path: '/lists/add', config: h.lists.add });
            server.route({ method: 'GET',  path: '/lists/edit/{listSlug}', config: h.lists.edit });
            server.route({ method: 'POST', path: '/lists/update/{listKey}', config: h.lists.update });
            server.route({ method: 'GET',  path: '/lists/delete/{listKey}', config: h.lists.delete });

            ////////////////////////////////// PEOPLE

            server.route({ method: 'GET',  path: '/people', config: h.people.list });
            server.route({ method: 'GET',  path: '/people/{person}', config: h.people.get });
            server.route({ method: 'GET',  path: '/people/add', config: h.people.add });
            server.route({ method: 'POST', path: '/people/add', config: h.people.create });
            server.route({ method: 'GET',  path: '/profile/edit/{person}', config: h.people.edit });
            server.route({ method: 'POST', path: '/profile/update/{person}', config: h.people.update });
            server.route({ method: 'GET',  path: '/people/delete/{personKey}/{personName}', config: h.people.delete });
            server.route({ method: 'GET',  path: '/people/approve/{person}', config: h.people.approve });
            server.route({ method: 'GET',  path: '/people/moderator/{person}', config: h.people.moderator });
            server.route({ method: 'GET',  path: '/people/admin/{person}', config: h.people.admin });

            ////////////////////////////////// PLACES

            server.route({ method: 'GET',  path: '/places', config: h.places.list });
            server.route({ method: 'GET',  path: '/places/{place}', config: h.places.get });
            server.route({ method: 'GET',  path: '/places/add', config: h.places.add });
            server.route({ method: 'POST', path: '/places/add', config: h.places.create });
            server.route({ method: 'GET',  path: '/places/edit/{placeSlug}', config: h.places.edit });
            server.route({ method: 'POST', path: '/places/update/{placeKey}', config: h.places.update });
            server.route({ method: 'GET',  path: '/places/star/{placeKey}', config: h.places.star });
            server.route({ method: 'GET',  path: '/places/approve/{place}', config: h.places.approve });
            server.route({ method: 'GET',  path: '/places/delete/{placeKey}/{placeName}', config: h.places.delete });

            ////////////////////////////////// GROUPS

            server.route({ method: 'GET',  path: '/groups', config: h.groups.list });
            server.route({ method: 'GET',  path: '/groups/{group}', config: h.groups.get });
            server.route({ method: 'GET',  path: '/groups/add', config: h.groups.add });
            server.route({ method: 'POST', path: '/groups/add', config: h.groups.create });
            server.route({ method: 'GET',  path: '/groups/edit/{groupSlug}', config: h.groups.edit });
            server.route({ method: 'POST', path: '/groups/update/{groupKey}', config: h.groups.update });
            server.route({ method: 'GET',  path: '/groups/star/{groupKey}', config: h.groups.star });
            server.route({ method: 'GET',  path: '/groups/approve/{group}', config: h.groups.approve });
            server.route({ method: 'GET',  path: '/groups/delete/{groupKey}/{groupName}', config: h.groups.delete });

            ////////////////////////////////// PENDING

            server.route({ method: 'GET',  path: '/pending', config: h.pending.list });

            ////////////////////////////////// AUTH

            server.route({ method: ['GET', 'POST'], path: '/auth/twitter', config: h.auth.login });
            server.route({ method: 'GET', path: '/session', config: h.auth.session });
            server.route({ method: 'GET', path: '/logout', config: h.auth.logout });

            if (err) {
                process.stderr.write('Error setting up tests', err, '\n');
                process.exit(1);
            }

            done();

        });

    });

    lab.test('load home page', function (done) {
        var options = { method: 'GET', url: '/' };
        server.inject(options, function (response) {
            expect(response.statusCode).to.equal(200);
            done();
        });
    });

    lab.test('404 error', function (done) {
        var options = { method: 'GET', url: '/chumbawumba' };
        server.inject(options, function (response) {
            expect(response.statusCode).to.equal(404);
            done();
        });
    });

    lab.test('load people list', function (done) {
        var options = { method: 'GET', url: '/people' };
        server.inject(options, function (response) {
            expect(response.statusCode).to.equal(200);
            done();
        });
    });

    lab.test('load places list', function (done) {
        var options = { method: 'GET', url: '/places' };
        server.inject(options, function (response) {
            expect(response.statusCode).to.equal(200);
            done();
        });
    });

    // TODO: fix error "Cannot read property 'name' of undefined" 
    // lab.test('load lists list', function (done) {
    //     var options = { method: 'GET', url: '/lists' };
    //     server.inject(options, function (response) {
    //         expect(response.statusCode).to.equal(200);
    //         done();
    //     });
    // });

    lab.test('load groups list', function (done) {
        var options = { method: 'GET', url: '/groups' };
        server.inject(options, function (response) {
            expect(response.statusCode).to.equal(200);
            done();
        });
    });

});    