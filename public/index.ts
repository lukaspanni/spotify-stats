const baseUrl = 'https://api.spotify.com/v1/';
const timeRange = 'long_term';

//TODO extract common types
let accessToken: { token: string; expires: number; refreshToken: string } | null = null;

type Artist = { name: string; genres: [string]; id: string; popularity: number };
type TopArtistsResponse = { items: Artist[]; total: number };

document.addEventListener('DOMContentLoaded', async () => {
  //const accessToken = new URLSearchParams(window.location.hash.replace('#', '')).get('accessToken');
  const accessTokenCookie = document.cookie
    .split(';')
    .find((c) => c.startsWith('accessToken='))
    ?.split('=')[1];

  accessToken = JSON.parse(decodeURIComponent(accessTokenCookie ?? '{}'));
  if (accessToken == null || accessToken.token === '') {
    const loginLink = document.createElement('a');
    loginLink.href = '/login';
    loginLink.innerText = 'Login';
    document.getElementsByTagName('body')[0].appendChild(loginLink);
    return;
  }

  const dataUrl = 'me/top/artists?time_range=' + timeRange;

  const result = await fetch(baseUrl + dataUrl, {
    mode: 'cors',
    headers: { Authorization: 'Bearer ' + accessToken.token }
  });
  const topArtists = (await result.json()) as TopArtistsResponse;

  const artistTopListContainer = document.getElementById('artists-top-list-container') as HTMLDivElement;
  const artistTopLevelList = document.createElement('ul');
  artistTopListContainer.appendChild(artistTopLevelList);

  const genreTopListContainer = document.getElementById('genres-top-list-container') as HTMLDivElement;
  const genreList = document.createElement('ul');
  genreTopListContainer.appendChild(genreList);

  topArtists.items.forEach((artist) => addArtist(artist, artistTopLevelList));
  topGenres.sort((a, b) => b.count - a.count);
  topGenres.forEach((genre) => addGenre(genre, genreList));
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

const addArtist = (artist: Artist, topLevelList: HTMLUListElement): void => {
  const artistItem = document.createElement('li') as HTMLLIElement;
  topLevelList.appendChild(artistItem);
  artistItem.textContent = artist.name;

  const genreList = document.createElement('ul') as HTMLUListElement;
  artistItem.appendChild(genreList);
  artist.genres.forEach((genre) => {
    const genreItem = document.createElement('li');
    genreItem.textContent = genre;
    genreList.appendChild(genreItem);
    pushGenre(genre);
  });
};

const addGenre = (genre: { genre: string; count: number }, list: HTMLUListElement) => {
  const genreItem = document.createElement('li');
  genreItem.textContent = genre.genre;
  list.appendChild(genreItem);
};
