import { MDCSelect } from '@material/select';
import { MDCDialog } from '@material/dialog';
import { MDCTextField } from '@material/textfield';
import { MDCSnackbar } from '@material/snackbar';
import { Artist, SpotifyTopListElement, TimeRange, TopListsClient, Track } from './top-lists-client';
import { TopListsClientFactory } from './top-lists-client-factory';
import { PaginationData } from './pagination-data';
import { TranslationMapper, TranslationMapperError } from './translation-mapper';

let topListsClient: TopListsClient;
const allowedTimeRanges: string[] = ['long_term', 'medium_term', 'short_term'];
let timeRange: TimeRange = 'short_term';

const defaultLimit = 10;

const artistsPaginationData = new PaginationData(0, defaultLimit, 0);
const tracksPaginationData = new PaginationData(0, defaultLimit, 0);

//TODO extract common types
let accessToken: { token: string; expires: number; refreshToken: string } | null = null;

let translationMapper: TranslationMapper;

// Store all fetched tracks for display
let allTopTracks: Track[] = [];
const allTopTrackIds: Set<string> = new Set();

let snackbar: MDCSnackbar;

document.addEventListener('DOMContentLoaded', async () => {
  translationMapper = new TranslationMapper(TranslationMapper.detectLanguage());
  translationMapper.initializedPromise.then(() => {
    initializeTranslations();
    initMaterialComponents();
  });

  if (!checkAccessToken()) {
    initializeView(false);
    return;
  } else initializeView(true);

  try {
    topListsClient = new TopListsClientFactory().getTopListsClient(accessToken?.token);
  } catch (e) {
    console.error(e);
    return; // cannot continue, TODO: error message
  }

  getTimeRange();
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

const initializeTranslations = (): void => {
  const translatableElements = Array.from(document.querySelectorAll('[data-translation-key]'));
  for (const element of translatableElements) {
    const key = element.getAttribute('data-translation-key') ?? '';
    try {
      element.textContent = translationMapper.get(key);
    } catch (e) {
      if (e instanceof TranslationMapperError) console.warn(e.message); // TODO: retry later
    }
  }
};

const initializeView = (authorized: boolean): void => {
  const topListsContainer = document.getElementById('top-lists-container');
  if (topListsContainer != null) topListsContainer.style.display = authorized ? 'block' : 'none';

  const authorizeContainer = document.getElementById('authorize-container');
  if (authorizeContainer != null) authorizeContainer.style.display = authorized ? 'none' : 'block';

  //TODO: refactor out
  const loadMoreTracksButton = document.getElementById('load-more-tracks');
  const loadMoreArtistsButton = document.getElementById('load-more-artists');
  const createPlaylistButton = document.getElementById('create-playlist-button');

  if (loadMoreTracksButton == null || loadMoreArtistsButton == null) return;

  // Initially hide the create playlist button
  if (createPlaylistButton) createPlaylistButton.style.display = 'none';

  tracksPaginationData.registerChangedHandler('load-more-button', (value) => {
    loadMoreTracksButton.style.display = value.remainingElements > 0 ? 'block' : 'none';
  });

  artistsPaginationData.registerChangedHandler('load-more-button', (value) => {
    loadMoreArtistsButton.style.display = value.remainingElements > 0 ? 'block' : 'none';
  });

  loadMoreTracksButton.addEventListener('click', () => {
    console.log(`load ${tracksPaginationData.currentLimit} more tracks`);
    tracksPaginationData.updateOffset();
    fetchTopTracks();
  });

  loadMoreArtistsButton.addEventListener('click', () => {
    console.log(`load ${artistsPaginationData} more artists`);
    artistsPaginationData.updateOffset();
    fetchTopArtists();
  });
};

const initMaterialComponents = (): void => {
  const selectElement = document.querySelector('.mdc-select');
  if (selectElement == null) return;
  const select = new MDCSelect(selectElement);
  select.setSelectedIndex(allowedTimeRanges.indexOf(timeRange));
  select.listen('MDCSelect:change', () => selectedTimeRangeChanged(select.value));

  // Initialize snackbar
  const snackbarElement = document.querySelector('.mdc-snackbar');
  if (snackbarElement) {
    snackbar = new MDCSnackbar(snackbarElement);
  }

  // Initialize text field for playlist name input
  const textFieldElement = document.querySelector('.mdc-text-field');
  if (textFieldElement) new MDCTextField(textFieldElement);

  // Initialize dialog
  const dialogElement = document.querySelector('#create-playlist-dialog');
  if (dialogElement) {
    const dialog = new MDCDialog(dialogElement);

    const createPlaylistButton = document.getElementById('create-playlist-button');
    if (createPlaylistButton)
      createPlaylistButton.addEventListener('click', () => {
        showCreatePlaylistDialog(dialog);
      });

    dialog.listen('MDCDialog:closed', (event: any) => {
      if (event.detail.action === 'accept') handleCreatePlaylist();
    });
  }
};

const showToast = (message: string): void => {
  if (snackbar) {
    snackbar.labelText = message;
    snackbar.open();
  }
};

const getTimeRange = (): void => {
  const queryTimeRange = new URLSearchParams(window.location.search).get('time_range');
  if (queryTimeRange && allowedTimeRanges.includes(queryTimeRange)) timeRange = queryTimeRange as TimeRange;

  translationMapper.initializedPromise.then(() => {
    let timeRangeString: string;
    try {
      timeRangeString = translationMapper.get('time-range-' + timeRange.replace('_', '-'));
    } catch (e) {
      if (e instanceof TranslationMapperError)
        timeRangeString = timeRange
          .split('_')
          .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
          .join(' ');
    }
    (document.querySelectorAll('span.time-range-string') as NodeListOf<HTMLSpanElement>).forEach(
      (timeRangeElement) => (timeRangeElement.textContent = timeRangeString)
    );
  });
};

const selectedTimeRangeChanged = async (newTimeRange: string): Promise<void> => {
  if (allowedTimeRanges.includes(newTimeRange)) {
    timeRange = newTimeRange as TimeRange;
    history.pushState(null, timeRange, window.location.href.split('?')[0] + '?time_range=' + timeRange);
    resetTopLists(); // make sure old data is cleared
    await fetchAll();
    getTimeRange();
  }
};

const addArtistCell = (index: number, artist: Artist): void => {
  // use the smallest image at least 300x300px, default order is widest first
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

const resetTopLists = (): void => {
  artistsPaginationData.reset(0, defaultLimit, 0);
  tracksPaginationData.reset(0, defaultLimit, 0);
  allTopTracks = [];
  allTopTrackIds.clear();
  document.querySelectorAll('.grid-content').forEach((e) => (e.innerHTML = ''));
  document.querySelectorAll('.error-message').forEach((e) => e.classList.add('hidden'));

  // Hide create playlist button when resetting
  const createPlaylistButton = document.getElementById('create-playlist-button');
  if (createPlaylistButton) createPlaylistButton.style.display = 'none';
};

const fetchAll = async (): Promise<any> => {
  return Promise.all([fetchTopArtists(), fetchTopTracks()]);
};

const fetchTopArtists = async (): Promise<void> => {
  const topArtists = await topListsClient.getTopArtists(
    timeRange as TimeRange,
    artistsPaginationData.currentLimit,
    artistsPaginationData.currentOffset
  );
  if (topArtists == null || topArtists.total === 0) {
    showTopArtistsErrorMessage();
    return;
  }
  artistsPaginationData.total = topArtists.total;
  topArtists.items.forEach((artist, index) => addArtistCell(++index + artistsPaginationData.currentOffset, artist));
};

const fetchTopTracks = async (): Promise<void> => {
  const topTracks = await topListsClient.getTopTracks(
    timeRange as TimeRange,
    tracksPaginationData.currentLimit,
    tracksPaginationData.currentOffset
  );
  if (topTracks == null || topTracks.total === 0) {
    showTopTracksErrorMessage();
    return;
  }
  tracksPaginationData.total = topTracks.total;

  // Store tracks for display (avoid duplicates using persistent Set)
  const uniqueNewTracks = topTracks.items.filter((track) => !allTopTrackIds.has(track.id));
  uniqueNewTracks.forEach((track) => allTopTrackIds.add(track.id));
  allTopTracks = allTopTracks.concat(uniqueNewTracks);

  topTracks.items.forEach((track, index) => addTrackCell(++index + tracksPaginationData.currentOffset, track));

  // Show create playlist button after tracks are loaded
  const createPlaylistButton = document.getElementById('create-playlist-button');
  if (createPlaylistButton && allTopTracks.length > 0) createPlaylistButton.style.display = 'block';
};

const showTopArtistsErrorMessage = (): void => {
  const element = document.querySelector('#top-artists-grid .error-message');
  if (element == null) return;
  element.classList.remove('hidden');
};

const showTopTracksErrorMessage = (): void => {
  const element = document.querySelector('#top-tracks-grid .error-message');
  if (element == null) return;
  element.classList.remove('hidden');
};

const showCreatePlaylistDialog = async (dialog: MDCDialog): Promise<void> => {
  const playlistNameInput = document.getElementById('playlist-name-input') as HTMLInputElement;
  const tracksChecklistContainer = document.getElementById('tracks-checklist');
  const playlistLoading = document.getElementById('playlist-loading');
  const playlistSelection = document.getElementById('playlist-tracks-selection');
  const confirmButton = document.getElementById('create-playlist-confirm-button');

  if (!tracksChecklistContainer || !playlistLoading || !playlistSelection) return;

  // Set default playlist name using translations
  if (playlistNameInput) {
    let playlistTitleKey = 'playlist-title-4-weeks';
    if (timeRange === 'long_term') playlistTitleKey = 'playlist-title-all-time';
    else if (timeRange === 'medium_term') playlistTitleKey = 'playlist-title-6-months';

    try {
      playlistNameInput.value = translationMapper.get(playlistTitleKey);
    } catch {
      playlistNameInput.value = 'My Top Tracks';
    }
  }

  // Show loading and disable confirm button
  playlistSelection.style.display = 'none';
  playlistLoading.style.display = 'block';
  if (confirmButton) confirmButton.setAttribute('disabled', 'true');

  dialog.open();

  // Fetch ALL tracks for the selected time range
  try {
    const allTracksForTimeRange = await topListsClient.getTopTracks(timeRange, 50, 0);

    if (!allTracksForTimeRange || allTracksForTimeRange.items.length === 0) {
      showToast(translationMapper.get('no-tracks-available'));
      dialog.close();
      return;
    }

    // Build checklist
    tracksChecklistContainer.innerHTML = '';
    allTracksForTimeRange.items.forEach((track, index) => {
      const checkbox = document.createElement('div');
      checkbox.style.cssText = 'padding: 8px; border-bottom: 1px solid #eee;';
      checkbox.innerHTML = `
        <label style="display: flex; align-items: center; cursor: pointer;">
          <input type="checkbox" checked data-track-id="${track.id}" style="margin-right: 8px;">
          <span>${index + 1}. ${track.name} - ${track.artists.map((a) => a.name).join(', ')}</span>
        </label>
      `;
      tracksChecklistContainer.appendChild(checkbox);
    });

    // Hide loading, show selection, enable confirm button
    playlistLoading.style.display = 'none';
    playlistSelection.style.display = 'block';
    if (confirmButton) confirmButton.removeAttribute('disabled');
  } catch (error) {
    console.error('Error fetching tracks:', error);
    showToast(translationMapper.get('playlist-created-error'));
    dialog.close();
  }
};

const handleCreatePlaylist = async (): Promise<void> => {
  const playlistNameInput = document.getElementById('playlist-name-input') as HTMLInputElement;
  const playlistName = playlistNameInput?.value || 'My Top Tracks';
  const tracksChecklistContainer = document.getElementById('tracks-checklist');
  const confirmButton = document.getElementById('create-playlist-confirm-button');

  if (!tracksChecklistContainer) return;

  // Get selected track IDs
  const selectedCheckboxes = tracksChecklistContainer.querySelectorAll('input[type="checkbox"]:checked');
  const selectedTrackIds = Array.from(selectedCheckboxes)
    .map((cb) => (cb as HTMLInputElement).dataset.trackId)
    .filter((id): id is string => !!id);

  if (selectedTrackIds.length === 0) {
    showToast(translationMapper.get('no-tracks-available'));
    return;
  }

  // Disable confirm button and show loading state
  if (confirmButton) {
    confirmButton.setAttribute('disabled', 'true');
    try {
      confirmButton.querySelector('.mdc-button__label')!.textContent = translationMapper.get('creating-playlist');
    } catch {
      confirmButton.querySelector('.mdc-button__label')!.textContent = 'Creating...';
    }
  }

  // Convert track IDs to URIs
  const trackUris = selectedTrackIds.map((id) => `spotify:track:${id}`);

  // Create the playlist
  const result = await topListsClient.createPlaylist(playlistName, trackUris);

  // Re-enable button
  if (confirmButton) {
    confirmButton.removeAttribute('disabled');
    try {
      confirmButton.querySelector('.mdc-button__label')!.textContent = translationMapper.get('confirm-button');
    } catch {
      confirmButton.querySelector('.mdc-button__label')!.textContent = 'Create';
    }
  }

  if (result) {
    showToast(translationMapper.get('playlist-created-success'));
    // Open playlist in Spotify
    window.open(result.external_urls.spotify, '_blank');
  } else showToast(translationMapper.get('playlist-created-error'));
};
