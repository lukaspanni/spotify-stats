import { randomBytes } from 'crypto';
import express from 'express';
import cors from 'cors';
import axios, { AxiosRequestConfig } from 'axios';
import cookieParser from 'cookie-parser';

const clientId: string = process.env.SPOTIFY_CLIENT_ID as string;
const clientSecret: string = process.env.SPOTIFY_CLIENT_SECRET as string;

const scopes = 'user-read-private user-read-email user-top-read';
const baseUrl = 'https://api.spotify.com/v1/';
const accountBaseUrl = 'https://accounts.spotify.com/';

let accessToken: { token: string; expires: number; refreshToken: string } | null = null;

type TokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
};

//use codespace url for development (spotify app needs to be updated to accept this url!)
let redirectUrl =
  process.env.CODESPACE_NAME !== ''
    ? 'https://' + process.env.CODESPACE_NAME + '-8080.githubpreview.dev/spotify-callback'
    : 'http://localhost:8080/spotify-callback';
redirectUrl = 'http://localhost:8080/spotify-callback';

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

app.get('/spotify-callback', async (req, res) => {
  const code = req.query.code || null;
  const state = req.query.state || null;
  console.log(req.cookies);
  const storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    //state did not match
    res.send('Error');
  } else {
    res.clearCookie(stateKey);

    const data = new URLSearchParams();
    data.append('code', code as string);
    data.append('redirect_uri', redirectUrl);
    data.append('grant_type', 'authorization_code');

    const options: AxiosRequestConfig = {
      method: 'POST',
      url: accountBaseUrl + 'api/token',
      data: data,
      headers: {
        Authorization: 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
      }
    };
    //get token
    try {
      const response = await axios.request(options);
      if (response.status !== 200) {
        redirectInvalidToken(res);
        return;
      }
      const responseData = response.data as TokenResponse;
      accessToken = {
        token: responseData.access_token,
        expires: new Date().setSeconds(new Date().getSeconds() + responseData.expires_in),
        refreshToken: responseData.refresh_token
      };
      res.redirect(
        '/#' +
          new URLSearchParams({
            accessToken: accessToken.token,
            refreshToken: accessToken.refreshToken,
            expires: accessToken.expires.toString()
          })
      );
    } catch (err) {
      redirectInvalidToken(res);
      return;
    }
  }
});

app.listen(8080);
console.log('Listen');

const redirectInvalidToken = (res: any) => {
  res.redirect(
    '/#' +
      new URLSearchParams({
        error: 'invalid_token'
      })
  );
};
