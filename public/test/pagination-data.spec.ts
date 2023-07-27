import { PaginationData } from '../pagination-data';

describe('PaginationData Bug', () => {
  it('remaining elements should be monotonously decreasing if total - limit < limit', () => {
    // Prevents bug where elements were loaded twice
    const paginationData = new PaginationData(16, 10, 0);
    const remainingElements = paginationData.remainingElements;
    paginationData.updateOffset();
    expect(paginationData.remainingElements).toBeLessThan(remainingElements);
  });
});
