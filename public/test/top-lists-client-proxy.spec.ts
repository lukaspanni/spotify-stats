import { TopListsClientProxy } from '../top-lists-client-proxy';

describe('TopListsClientProxy', () => {
  it('should implement getRecommendations method', () => {
    const client = new TopListsClientProxy('test-token');
    expect(typeof client.getRecommendations).toBe('function');
  });

  it('should implement getAvailableGenreSeeds method', () => {
    const client = new TopListsClientProxy('test-token');
    expect(typeof client.getAvailableGenreSeeds).toBe('function');
  });
});
