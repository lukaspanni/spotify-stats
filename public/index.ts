const baseUrl = 'https://api.spotify.com/v1/';

document.addEventListener('DOMContentLoaded', async () => {
  const accessToken = new URLSearchParams(window.location.hash.replace('#', '')).get('accessToken');

  const dataUrl = 'me/top/artists?time_range=short_term';

  const result = await fetch(baseUrl + dataUrl, { mode: 'cors', headers: { Authorization: 'Bearer ' + accessToken } });
  console.log(await result.json());
});
