"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
const express_1 = __importDefault(require("express"));
const request_1 = __importDefault(require("request"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const scopes = 'user-read-private user-read-email';
const baseUrl = 'https://api.spotify.com/v1/';
const accountBaseUrl = 'https://accounts.spotify.com/';
//use codespace url for development (spotify app needs to be updated to accept this url!)
let redirectUrl = process.env.CODESPACE_NAME !== ''
    ? 'https://' + process.env.CODESPACE_NAME + '-8080.githubpreview.dev/spotify-callback'
    : 'http://localhost:8080/spotify-callback';
const stateKey = 'auth-state';
const app = (0, express_1.default)();
app.use(express_1.default.static(__dirname + '/public')).use((0, cookie_parser_1.default)());
app.get('/login', (req, res) => {
    const state = (0, crypto_1.randomBytes)(16).toString('hex');
    res.cookie(stateKey, state, { secure: false });
    const authQueryParams = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        scope: scopes,
        redirect_uri: redirectUrl,
        state: state
    });
    // redirect to spotify auth page
    res.redirect(accountBaseUrl + 'authorize?' + authQueryParams);
});
app.get('/spotify-callback', (req, res) => {
    const code = req.query.code || null;
    const state = req.query.state || null;
    console.log(req.cookies);
    const storedState = req.cookies ? req.cookies[stateKey] : null;
    if (state === null || state !== storedState) {
        //state did not match
        res.send('Error');
    }
    else {
        res.clearCookie(stateKey);
        var authOptions = {
            url: accountBaseUrl + 'api/token',
            form: {
                code: code,
                redirect_uri: redirectUrl,
                grant_type: 'authorization_code'
            },
            headers: {
                Authorization: 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
            },
            json: true
        };
        //get token
        request_1.default.post(authOptions, (error, response, body) => {
            if (!error && response.statusCode === 200) {
                const accessToken = body.access_token;
                const refreshToken = body.refresh_token;
                const options = {
                    url: baseUrl + 'me',
                    headers: { Authorization: 'Bearer ' + accessToken },
                    json: true
                };
                request_1.default.get(options, (error, response, body) => {
                    console.log(body);
                });
                // redirect to base path with access token to enable client-side requests
                res.redirect('/#' +
                    new URLSearchParams({
                        access_token: accessToken,
                        refresh_token: refreshToken
                    }));
            }
            else {
                res.redirect('/#' +
                    new URLSearchParams({
                        error: 'invalid_token'
                    }));
            }
        });
    }
});
app.listen(8080);
console.log('Listen');
