import { MDCSelect } from '@material/select';
import { Artist, SpotifyTopListElement, TimeRange, TopListsClient, Track } from './top-lists-client';
import { TopListsClientFactory } from './top-lists-client-factory';
import { PaginationData } from './pagination-data';

let topListsClient: TopListsClient;
const allowedTimeRanges: string[] = ['long_term', 'medium_term', 'short_term'];
let timeRange: TimeRange = 'long_term';

const defaultLimit = 10;

const artistsPaginationData = new PaginationData(0, defaultLimit, 0);
const tracksPaginationData = new PaginationData(0, defaultLimit, 0);

//TODO extract common types
let accessToken: { token: string; expires: number; refreshToken: string } | null = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!checkAccessToken()) {
    initializeView(false);
    return;
  } else {
    initializeView(true);
  }

  try {
    topListsClient = new TopListsClientFactory().getTopListsClient(accessToken?.token);
  } catch (e) {
    console.error(e);
    return; // cannot continue, TODO: error message
  }

  getTimeRange();
  initMaterialComponents();
  resetTopLists();
  await fetchAll();
});

const checkAccessToken = (): boolean => {
  const accessTokenCookie = document.cookie
    .split(';')
    .map((c) => c.trim())
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

const initializeView = (authorized: boolean) => {
  const topListsContainer = document.getElementById('top-lists-container');
  if (topListsContainer != null) topListsContainer.style.display = authorized ? 'block' : 'none';

  const authorizeContainer = document.getElementById('authorize-container');
  if (authorizeContainer != null) {
    authorizeContainer.style.display = authorized ? 'none' : 'block';
  }

  //TODO: refactor out
  const loadMoreTracksButton = document.getElementById('load-more-tracks');
  const loadMoreArtistsButton = document.getElementById('load-more-artists');
  if (loadMoreTracksButton == null || loadMoreArtistsButton == null) return;
  tracksPaginationData.registerChangedHandler('load-more-button', (value) => {
    loadMoreTracksButton.style.display = value.remainingElements > 0 ? 'block' : 'none';
  });
  artistsPaginationData.registerChangedHandler('load-more-button', (value) => {
    loadMoreArtistsButton.style.display = value.remainingElements > 0 ? 'block' : 'none';
  });

  loadMoreTracksButton.addEventListener('click', () => {
    console.log(`load ${tracksPaginationData.currentLimit} more tracks`);
    tracksPaginationData.currentOffset += tracksPaginationData.currentLimit;
    fetchTopTracks();
  });

  loadMoreArtistsButton.addEventListener('click', () => {
    console.log(`load ${artistsPaginationData} more artists`);
    artistsPaginationData.currentOffset += artistsPaginationData.currentLimit;
    fetchTopArtists();
  });
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

  const timeRangeString = timeRange
    .split('_')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');
  (document.querySelectorAll('span.time-range-string') as NodeListOf<HTMLSpanElement>).forEach(
    (timeRangeElement) => (timeRangeElement.textContent = timeRangeString)
  );
};

const selectedTimeRangeChanged = async (newTimeRange: string) => {
  if (allowedTimeRanges.includes(newTimeRange)) {
    timeRange = newTimeRange as TimeRange;
    history.pushState(null, timeRange, window.location.href.split('?')[0] + '?time_range=' + timeRange);
    resetTopLists(); // make sure old data is cleared
    await fetchAll();
    getTimeRange();
  }
};

const addArtistCell = (index: number, artist: Artist): void => {
  // use smallest image at least 300x300px, default order is widest first
  const imageUrl = artist.images.reverse().find((i) => i.height >= 300)?.url;
  if (!imageUrl) return;
  const image = document.createElement('img');
  image.src = imageUrl;
  const artistInfo = document.createElement('div');
  artistInfo.classList.add('info');
  artistInfo.innerHTML = `<h5>${index + '. ' + artist.name}</h5><h6>${artist.genres.join(', ')}</h6>`;

  const artistItem = createCell(artist, image, artistInfo);
  (document.getElementById('top-artists-grid-inner') as HTMLDivElement).appendChild(artistItem);
};

const addTrackCell = (index: number, track: Track): void => {
  // only use 300x300px images
  const imageUrl = track.album.images.find((i) => i.height === 300)?.url;
  if (!imageUrl) return;
  const image = document.createElement('img');
  image.src = imageUrl;

  const trackInfo = document.createElement('div');
  trackInfo.classList.add('info');
  trackInfo.innerHTML = `<h5>${index + '. ' + track.name}</h5><h6>${track.artists.map((a) => a.name).join(', ')}</h6>`;

  const trackItem = createCell(track, image, trackInfo);
  (document.getElementById('top-tracks-grid-inner') as HTMLDivElement).appendChild(trackItem);
};

const createCell = (topListElement: SpotifyTopListElement, ...content: HTMLElement[]): HTMLDivElement => {
  const cell = document.createElement('div');
  cell.classList.add(
    'cell',
    'mdc-layout-grid__cell',
    'mdc-layout-grid__cell--span-2-desktop',
    'mdc-layout-grid__cell--span-4-tablet'
  );
  const link = document.createElement('a');
  link.classList.add('spotify-link');
  link.href = topListElement.external_urls.spotify;
  link.target = '_blank';
  const innerContainer = document.createElement('div');
  innerContainer.classList.add('inner-container');
  innerContainer.append(...content);
  link.appendChild(innerContainer);
  cell.appendChild(link);
  return cell;
};

const resetTopLists = () => {
  artistsPaginationData.reset(0, defaultLimit, 0);
  tracksPaginationData.reset(0, defaultLimit, 0);
  document.querySelectorAll('.grid-content').forEach((e) => (e.innerHTML = ''));
  document.querySelectorAll('.error-message').forEach((e) => e.classList.add('hidden'));
};

const fetchAll = async () => {
  return Promise.all([fetchTopArtists(), fetchTopTracks()]);
};

const fetchTopArtists = async () => {
  const topArtists = await topListsClient.getTopArtists(
    timeRange as TimeRange,
    artistsPaginationData.currentLimit,
    artistsPaginationData.currentOffset
  );
  if (topArtists == null || topArtists.total == 0) {
    showTopArtistsErrorMessage();
    return;
  }
  artistsPaginationData.total = topArtists.total;
  topArtists.items.forEach((artist, index) => addArtistCell(++index + artistsPaginationData.currentOffset, artist));
};

const fetchTopTracks = async () => {
  const topTracks = await topListsClient.getTopTracks(
    timeRange as TimeRange,
    tracksPaginationData.currentLimit,
    tracksPaginationData.currentOffset
  );
  if (topTracks == null || topTracks.total == 0) {
    showTopTracksErrorMessage();
    return;
  }
  tracksPaginationData.total = topTracks.total;
  topTracks.items.forEach((track, index) => addTrackCell(++index + tracksPaginationData.currentOffset, track));
};

const showTopArtistsErrorMessage = () => {
  const element = document.querySelector('#top-artists-grid .error-message');
  if (element == null) return;
  element.classList.remove('hidden');
};

const showTopTracksErrorMessage = () => {
  const element = document.querySelector('#top-tracks-grid .error-message');
  if (element == null) return;
  element.classList.remove('hidden');
};
