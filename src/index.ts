import { randomBytes } from 'crypto';
import express from 'express';
import request, { Response } from 'request';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const clientId: string = process.env.SPOTIFY_CLIENT_ID as string;
const clientSecret: string = process.env.SPOTIFY_CLIENT_SECRET as string;

const scopes = 'user-read-private user-read-email user-top-read';
const baseUrl = 'https://api.spotify.com/v1/';
const accountBaseUrl = 'https://accounts.spotify.com/';

//use codespace url for development (spotify app needs to be updated to accept this url!)
let redirectUrl =
  process.env.CODESPACE_NAME !== ''
    ? 'https://' + process.env.CODESPACE_NAME + '-8080.githubpreview.dev/spotify-callback'
    : 'http://localhost:8080/spotify-callback';

const stateKey = 'auth-state';

const app = express();
app
  .use(express.static(__dirname + '/public'))
  .use(cors())
  .use(cookieParser());

app.get('/login', (req, res) => {
  const state = randomBytes(16).toString('hex');
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
  } else {
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
    request.post(authOptions, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        const accessToken = body.access_token;
        const refreshToken = body.refresh_token;

        const options = {
          url: baseUrl + 'me',
          headers: { Authorization: 'Bearer ' + accessToken },
          json: true
        };

        request.get(options, (error, response, body) => {
          console.log(body);
        });

        // redirect to base path with access token to enable client-side requests
        res.redirect(
          '/#' +
            new URLSearchParams({
              accessToken: accessToken,
              refreshToken: refreshToken
            })
        );
      } else {
        res.redirect(
          '/#' +
            new URLSearchParams({
              error: 'invalid_token'
            })
        );
      }
    });
  }
});

app.listen(8080);
console.log('Listen');
