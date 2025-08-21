import { getAppVersion } from '../../../../src/utils/version.js';

describe('getAppVersion', () => {
  it('should return version string from package.json', async () => {
    const version = await getAppVersion();

    // The version should be a valid semver string
    expect(version).toMatch(/^\d+\.\d+\.\d+/);
    expect(typeof version).toBe('string');
    expect(version.length).toBeGreaterThan(0);
  });
});
