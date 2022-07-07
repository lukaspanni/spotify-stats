const baseUrl = 'https://api.spotify.com/v1/';
const topEndpoint = 'me/top/';

const topArtistsUrl = baseUrl + topEndpoint + 'artists';
const topTracksUrl = baseUrl + topEndpoint + 'tracks';

const allowedTimeRanges = ['long_term', 'medium_term', 'short_term'];
let timeRange: string = 'long_term';

//TODO extract common types
let accessToken: { token: string; expires: number; refreshToken: string } | null = null;

type Artist = { name: string; genres: string[]; id: string; popularity: number };
type Track = { name: string; artists: Artist[]; id: string; popularity: number };
type TopArtistsResponse = { items: Artist[]; total: number };
type TopTracksResponse = { items: Track[]; total: number };

document.addEventListener('DOMContentLoaded', async () => {
  const accessTokenCookie = document.cookie
    .split(';')
    .find((c) => c.startsWith('accessToken='))
    ?.split('=')[1];

  if (!accessTokenCookie) return;

  accessToken = JSON.parse(decodeURIComponent(accessTokenCookie));
  if (accessToken == null || accessToken.token === '') {
    const loginLink = document.createElement('a');
    loginLink.href = '/login';
    loginLink.innerText = 'Login';
    document.getElementsByTagName('body')[0].appendChild(loginLink);
    return;
  }
  //check if token is still valid and refresh if not
  const now = new Date().getTime();
  if (accessToken.expires < now) {
    console.log('refreshing token');
    console.log(accessToken);
    //TODO
  }

  const queryTimeRange = new URLSearchParams(window.location.search).get('time_range');
  if (queryTimeRange && allowedTimeRanges.includes(queryTimeRange)) timeRange = queryTimeRange;

  const timeRangeElement = document.querySelector('#time-range > span');
  if (timeRangeElement !== null)
    timeRangeElement.textContent = timeRange
      .split('_')
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(' ');

  await Promise.all([fetchTopArtists(), fetchTopTracks()]);
});

const topGenres: { genre: string; count: number }[] = [];
const pushGenre = (genre: string) => {
  const exists = topGenres.find((g) => g.genre === genre);
  if (exists) {
    exists.count++;
  } else {
    topGenres.push({ genre, count: 1 });
  }
};

const addItem = (item: { name: string }, topLevelList: HTMLUListElement): void => {
  const listItem = document.createElement('li') as HTMLLIElement;
  topLevelList.appendChild(listItem);
  listItem.textContent = item.name;
};

const addGenre = (genre: { genre: string; count: number }, list: HTMLUListElement) => {
  const genreItem = document.createElement('li');
  genreItem.textContent = genre.genre;
  list.appendChild(genreItem);
};

const fetchTopData = async <T>(url: string): Promise<T | undefined> => {
  if (accessToken == null) return;

  const result = await fetch(url + '?time_range=' + timeRange, {
    mode: 'cors',
    headers: { Authorization: 'Bearer ' + accessToken.token }
  });

  return await result.json();
};

const fetchTopArtists = async () => {
  const topArtists = await fetchTopData<TopArtistsResponse>(topArtistsUrl);
  if (topArtists == null) return;

  const artistsTopListContainer = document.getElementById('artists-top-list-container') as HTMLDivElement;
  const artistsTopLevelList = document.createElement('ul');
  artistsTopListContainer.appendChild(artistsTopLevelList);

  //TODO: better way to determine top Genres
  // const genreTopListContainer = document.getElementById('genres-top-list-container') as HTMLDivElement;
  // const genreList = document.createElement('ul');
  // genreTopListContainer.appendChild(genreList);

  topArtists.items.forEach((artist) => {
    addItem(artist, artistsTopLevelList);
    //artist.genres.forEach((genre) => pushGenre(genre));
  });

  // topGenres.sort((a, b) => b.count - a.count);
  // topGenres.forEach((genre) => addGenre(genre, genreList));
};

const fetchTopTracks = async () => {
  const topTracks = await fetchTopData<TopTracksResponse>(topTracksUrl);
  if (topTracks == null) return;

  const tracksTopListContainer = document.getElementById('tracks-top-list-container') as HTMLDivElement;
  const tracksTopLevelList = document.createElement('ul');
  tracksTopListContainer.appendChild(tracksTopLevelList);

  topTracks.items.forEach((track) => addItem(track, tracksTopLevelList));
};
