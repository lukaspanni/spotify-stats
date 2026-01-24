export const missingEnvResponse = (): Response => {
  return new Response('Missing Spotify environment variables.', { status: 500 });
};

export const redirectInvalidToken = (): Response => {
  return buildRedirectResponse('/#' + new URLSearchParams({ error: 'invalid_token' }));
};

export const buildRedirectResponse = (location: string, cookies: string[] = []): Response => {
  const headers = new Headers({ Location: location });
  cookies.forEach((cookie) => headers.append('Set-Cookie', cookie));
  return new Response(null, { status: 302, headers });
};
