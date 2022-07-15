import { MDCSelect } from '@material/select';
import { MDCRipple } from '@material/ripple';

const baseUrl = 'https://api.spotify.com/v1/';
const topEndpoint = 'me/top/';

const topArtistsUrl = baseUrl + topEndpoint + 'artists';
const topTracksUrl = baseUrl + topEndpoint + 'tracks';

const allowedTimeRanges = ['long_term', 'medium_term', 'short_term'];
let timeRange: string = 'long_term';

//TODO extract common types
let accessToken: { token: string; expires: number; refreshToken: string } | null = null;

type Image = { url: string; height: number; width: number };
type Artist = { name: string; genres: string[]; id: string; popularity: number; images: Image[] };

type Track = {
  name: string;
  artists: Artist[];
  id: string;
  popularity: number;
  album: { name: string; images: Image[] };
};
type TopArtistsResponse = { items: Artist[]; total: number };
type TopTracksResponse = { items: Track[]; total: number };

document.addEventListener('DOMContentLoaded', async () => {
  if (!checkAccessToken()) {
    insertLoginButton();
    hideTopLists();
    return;
  }
  getTimeRange();

  initMaterialComponents();
  await fetchAll();
});

const fetchAll = async () => {
  await Promise.all([fetchTopArtists(), fetchTopTracks()]);
};

const checkAccessToken = (): boolean => {
  const accessTokenCookie = document.cookie
    .split(';')
    .find((c) => c.startsWith('accessToken='))
    ?.split('=')[1];
  if (!accessTokenCookie) return false;

  accessToken = JSON.parse(decodeURIComponent(accessTokenCookie));
  if (accessToken != null && accessToken.token !== '') {
    const now = new Date().getTime();
    //check if token is still valid and refresh if not
    if (accessToken.expires > now) return true;

    console.log('refreshing token');
    window.location.href = '/refresh-token';
  }

  return false;
};

const insertLoginButton = () => {
  const loginButton = document.createElement('button');
  loginButton.classList.add('mdc-button', 'mdc-button--raised');
  loginButton.id = 'login-button';

  const icon = document.createElement('i');
  icon.classList.add('material-icons', 'mdc-button__icon');
  icon.innerText = 'login';
  loginButton.appendChild(icon);

  const label = document.createElement('span');
  label.innerText = 'Login';
  label.className = 'mdc-button__label';
  loginButton.appendChild(label);

  const ripple = document.createElement('span');
  ripple.className = 'mdc-button__ripple';
  loginButton.appendChild(ripple);

  new MDCRipple(loginButton);
  loginButton.addEventListener('click', () => (document.location.href = '/login'));
  document.getElementsByTagName('body')[0].appendChild(loginButton);
};

const hideTopLists = () => {
  const container = document.getElementById('top-lists-container');
  if (container != null) container.style.display = 'none';
};

const topGenres: { genre: string; count: number }[] = [];
const pushGenre = (genre: string) => {
  const exists = topGenres.find((g) => g.genre === genre);
  if (exists) {
    exists.count++;
  } else {
    topGenres.push({ genre, count: 1 });
  }
};

//TODO: extract duplicated code
const addArtist = (index: number, artist: Artist, grid: HTMLDivElement): void => {
  const artistItem = document.createElement('div');
  artistItem.classList.add(
    'track-cell',
    'mdc-layout-grid__cell',
    'mdc-layout-grid__cell--span-3-desktop',
    'mdc-layout-grid__cell--span-6-tablet'
  );
  // use smallest image at least 300x300px, default order is widest first
  const imageUrl = artist.images.reverse().find((i) => i.height >= 300)?.url;
  if (imageUrl) {
    const image = document.createElement('img');
    image.src = imageUrl;
    artistItem.appendChild(image);
  }
  const artistInfo = document.createElement('div');
  artistInfo.classList.add('info');
  artistInfo.innerHTML = `<h5>${index + '. ' + artist.name}</h5><h6>${artist.genres.join(', ')}</h6>`;
  artistItem.appendChild(artistInfo);
  grid.appendChild(artistItem);
};

const addTrack = (index: number, track: Track, grid: HTMLDivElement): void => {
  const trackItem = document.createElement('div');
  trackItem.classList.add(
    'track-cell',
    'mdc-layout-grid__cell',
    'mdc-layout-grid__cell--span-2-desktop',
    'mdc-layout-grid__cell--span-4-tablet'
  );
  // only use 300x300px images
  const imageUrl = track.album.images.find((i) => i.height === 300)?.url;
  if (imageUrl) {
    const image = document.createElement('img');
    image.src = imageUrl;
    trackItem.appendChild(image);
  }
  const trackInfo = document.createElement('div');
  trackInfo.classList.add('info');
  trackInfo.innerHTML = `<h5>${index + '. ' + track.name}</h5><h6>${track.artists.map((a) => a.name).join(', ')}</h6>`;
  trackItem.appendChild(trackInfo);
  grid.appendChild(trackItem);
};

const addGenre = (genre: { genre: string; count: number }, list: HTMLUListElement) => {
  const genreItem = document.createElement('li');
  genreItem.textContent = genre.genre;
  list.appendChild(genreItem);
};

const fetchTopData = async <T>(url: string, limit: number = 10, offset: number = 0): Promise<T | undefined> => {
  if (accessToken == null) return;
  if (limit < 0) limit = 0;
  if (offset < 0) offset = 0;
  if (offset > 49) offset = 49;
  if (offset + limit > 50) limit = 50 - offset;

  const result = await fetch(`${url}?limit=${limit}&offset=${offset}&time_range=${timeRange}`, {
    mode: 'cors',
    headers: { Authorization: 'Bearer ' + accessToken.token }
  });

  return await result.json();
};

const fetchTopArtists = async () => {
  const topArtists = await fetchTopData<TopArtistsResponse>(topArtistsUrl);
  if (topArtists == null) return;

  const topArtistsGrid = document.querySelector('#top-artists-grid .grid-content') as HTMLDivElement;
  topArtistsGrid.innerHTML = '';

  // //TODO: better way to determine top Genres
  // // const genreTopListContainer = document.getElementById('genres-top-list-container') as HTMLDivElement;
  // // const genreList = document.createElement('ul');
  // // genreTopListContainer.appendChild(genreList);

  topArtists.items.forEach((artist, index) => {
    addArtist(++index, artist, topArtistsGrid);
    //artist.genres.forEach((genre) => pushGenre(genre));
  });

  // topGenres.sort((a, b) => b.count - a.count);
  // topGenres.forEach((genre) => addGenre(genre, genreList));
};

const fetchTopTracks = async () => {
  const topTracks = await fetchTopData<TopTracksResponse>(topTracksUrl);
  if (topTracks == null) return;

  const topTracksGrid = document.querySelector('#top-tracks-grid .grid-content') as HTMLDivElement;
  topTracksGrid.innerHTML = '';

  topTracks.items.forEach((track, index) => addTrack(++index, track, topTracksGrid));
};

const getTimeRange = () => {
  const queryTimeRange = new URLSearchParams(window.location.search).get('time_range');
  if (queryTimeRange && allowedTimeRanges.includes(queryTimeRange)) timeRange = queryTimeRange;

  const timeRangeElements = document.querySelectorAll('span.time-range-string') as NodeListOf<HTMLSpanElement>;
  if (timeRangeElements.length > 0)
    timeRangeElements.forEach(
      (item) =>
        (item.textContent = timeRange
          .split('_')
          .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
          .join(' '))
    );
};

const selectedTimeRangeChanged = async (newTimeRange: string) => {
  if (allowedTimeRanges.includes(newTimeRange)) {
    timeRange = newTimeRange;
    history.pushState(null, timeRange, window.location.href.split('?')[0] + '?time_range=' + timeRange);
    await fetchAll();
    getTimeRange();
  }
};

const initMaterialComponents = (): void => {
  const selectElement = document.querySelector('.mdc-select');
  if (selectElement == null) return;
  const select = new MDCSelect(selectElement);
  select.setSelectedIndex(allowedTimeRanges.indexOf(timeRange));
  select.listen('MDCSelect:change', () => selectedTimeRangeChanged(select.value));
};
