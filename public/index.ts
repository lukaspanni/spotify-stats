import { MDCSelect } from '@material/select';
import { MDCRipple } from '@material/ripple';
import { Artist, TimeRange, TopListsClient, Track } from './top-lists-client';

let topListsClient: TopListsClient;
const allowedTimeRanges: string[] = ['long_term', 'medium_term', 'short_term'];
let timeRange: TimeRange = 'long_term';

//TODO extract common types
let accessToken: { token: string; expires: number; refreshToken: string } | null = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!checkAccessToken()) {
    insertLoginButton();
    hideTopLists();
    return;
  }

  try {
    topListsClient = new TopListsClient(accessToken?.token);
  } catch (e) {
    console.error(e);
    return; // cannot continue, TODO: error message
  }

  getTimeRange();
  initMaterialComponents();
  await fetchAll();
});

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
const initMaterialComponents = (): void => {
  const selectElement = document.querySelector('.mdc-select');
  if (selectElement == null) return;
  const select = new MDCSelect(selectElement);
  select.setSelectedIndex(allowedTimeRanges.indexOf(timeRange));
  select.listen('MDCSelect:change', () => selectedTimeRangeChanged(select.value));
};

const getTimeRange = () => {
  const queryTimeRange = new URLSearchParams(window.location.search).get('time_range');
  if (queryTimeRange && allowedTimeRanges.includes(queryTimeRange)) timeRange = queryTimeRange as TimeRange;

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
    timeRange = newTimeRange as TimeRange;
    history.pushState(null, timeRange, window.location.href.split('?')[0] + '?time_range=' + timeRange);
    await fetchAll();
    getTimeRange();
  }
};

const addArtistCell = (index: number, artist: Artist, grid: HTMLDivElement): void => {
  const artistItem = createCell();
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

const addTrackCell = (index: number, track: Track, grid: HTMLDivElement): void => {
  const trackItem = createCell();
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

const createCell = (): HTMLDivElement => {
  const cell = document.createElement('div');
  cell.classList.add(
    'track-cell',
    'mdc-layout-grid__cell',
    'mdc-layout-grid__cell--span-2-desktop',
    'mdc-layout-grid__cell--span-4-tablet'
  );
  return cell;
};

const fetchAll = async () => {
  return Promise.all([fetchTopArtists(), fetchTopTracks()]);
};

const fetchTopArtists = async () => {
  //TODO: limit and offset
  const topArtists = await topListsClient.getTopArtists(timeRange as TimeRange);
  if (topArtists == null) return;

  const topArtistsGrid = document.querySelector('#top-artists-grid .grid-content') as HTMLDivElement;
  topArtistsGrid.innerHTML = '';

  topArtists.items.forEach((artist, index) => {
    addArtistCell(++index, artist, topArtistsGrid);
  });
};

const fetchTopTracks = async () => {
  //TODO: limit and offset
  const topTracks = await topListsClient.getTopTracks(timeRange as TimeRange);
  if (topTracks == null) return;

  const topTracksGrid = document.querySelector('#top-tracks-grid .grid-content') as HTMLDivElement;
  topTracksGrid.innerHTML = '';

  topTracks.items.forEach((track, index) => addTrackCell(++index, track, topTracksGrid));
};
