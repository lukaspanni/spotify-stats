import { randomBytes } from 'crypto';
import express from 'express';
import cors from 'cors';
import axios, { AxiosRequestConfig } from 'axios';
import cookieParser from 'cookie-parser';
import { createProxyMiddleware } from 'http-proxy-middleware';

// get environment variables
const clientId: string = process.env.SPOTIFY_CLIENT_ID as string;
const clientSecret: string = process.env.SPOTIFY_CLIENT_SECRET as string;
const redirectUrl: string = process.env.REDIRECT_URL as string;
const port: number = Number(process.env.PORT) || 8080;

const scopes = 'user-read-private user-read-email user-top-read';
const baseUrl = 'https://api.spotify.com/v1/';
const accountBaseUrl = 'https://accounts.spotify.com/';
type AccessToken = {
  token: string;
  expires: number;
  refreshToken?: string;
};

type TokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
};

let accessToken: AccessToken | null = null;

const stateKey = 'auth-state';
const app = express();
app
  .use(express.static(__dirname + '/public'))
  .use(cors())
  .use(cookieParser());

app.get('/login', (req, res) => {
  console.info(new Date(), '/login', req.ip, req.headers['user-agent']);
  const state = randomBytes(16).toString('hex');
  // console.debug('setting state', state);
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
  const storedState = req.cookies ? req.cookies[stateKey] : null;
  // console.debug('state from cookie', storedState);

  if (state === null || state !== storedState) {
    //state did not match
    res.send('Error, state did not match');
  } else {
    res.clearCookie(stateKey);

    const data = new URLSearchParams({
      code: code as string,
      redirect_uri: redirectUrl,
      grant_type: 'authorization_code'
    });
    const options = buildTokenRequestOptions(data);
    //get token
    try {
      const response = await axios.request(options);
      console.info(new Date(), '/spotify-callback token request status: ', response.status);
      if (response.status !== 200) {
        redirectInvalidToken(res);
        return;
      }
      const responseData = response.data as TokenResponse;
      //CAUTION: do not log access tokens! only availability status to debug api issues
      console.info(
        `got responseData, {accessTokenAvailable: ${responseData.access_token != null}, expires: ${
          responseData.expires_in
        }, refreshTokenAvailable: ${responseData.refresh_token != null}}`
      );
      accessToken = {
        token: responseData.access_token,
        expires: new Date().setSeconds(new Date().getSeconds() + responseData.expires_in),
        refreshToken: responseData.refresh_token
      };
      res.cookie('accessToken', JSON.stringify(accessToken), {
        maxAge: 60 * 60 * 24 * 30 * 1000
      });

      res.redirect('/');
    } catch (err) {
      redirectInvalidToken(res);
      return;
    }
  }
});

app.get('/refresh-token', async (req, res) => {
  console.info(new Date(), '/refresh-token', req.ip, req.headers['user-agent']);
  let accessToken: AccessToken | null = null;
  try {
    accessToken = JSON.parse(req.cookies.accessToken);
    if (accessToken == null || accessToken.refreshToken === undefined) throw new Error('No refresh token provided');
  } catch (err) {
    console.error('Error', err);
    res.cookie('accessToken', '{}');
    res.redirect('/login');
    return;
  }

  const data = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: accessToken.refreshToken
  });
  const options: AxiosRequestConfig = buildTokenRequestOptions(data);
  try {
    const response = await axios.request(options);
    const responseData = response.data as TokenResponse;
    accessToken = {
      token: responseData.access_token,
      expires: new Date().setSeconds(new Date().getSeconds() + responseData.expires_in),
      refreshToken: responseData.refresh_token ?? accessToken.refreshToken // use old refresh token if no new one provided
    };
    res.cookie('accessToken', JSON.stringify(accessToken), {
      maxAge: 60 * 60 * 24 * 30 * 1000
    });
  } catch (err) {
    res.cookie('accessToken', '{}');
    redirectInvalidToken(res);
    return;
  }

  res.redirect('/');
});

app.use(
  '/proxy-api',
  createProxyMiddleware('/proxy-api', {
    target: baseUrl,
    changeOrigin: true,
    pathRewrite: {
      '^/proxy-api': ''
    },
    onProxyReq: (proxyReq, req, res) => {
      proxyReq.setHeader('Authorization', req.headers.authorization ?? '');
    }
  })
);

app.listen(port);
console.log('Listen on ', port);

const redirectInvalidToken = (res: any) => {
  res.redirect(
    '/#' +
      new URLSearchParams({
        error: 'invalid_token'
      })
  );
};
const buildTokenRequestOptions = (data: URLSearchParams): AxiosRequestConfig<any> => {
  return {
    method: 'POST',
    url: accountBaseUrl + 'api/token',
    data: data,
    headers: {
      Authorization: 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
    }
  };
};
