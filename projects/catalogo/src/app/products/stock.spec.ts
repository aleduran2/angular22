import { stockLevel } from './stock';

describe('stockLevel', () => {
  it.each([
    [0, 'out'],
    [1, 'low'],
    [3, 'low'],
    [4, 'available'],
  ] as const)('classifies a stock of %i as %s', (stock, expected) => {
    expect(stockLevel({ stock })).toBe(expected);
  });
});
