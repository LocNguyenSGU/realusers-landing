import * as migration_20261111_142941_initial from './20261111_142941_initial';
import * as migration_20261113_070444_media_prefix from './20261113_070444_media_prefix';
import * as migration_20261119_155814_mcp_api_keys from './20261119_155814_mcp_api_keys';

export const migrations = [
  {
    up: migration_20261111_142941_initial.up,
    down: migration_20261111_142941_initial.down,
    name: '20261111_142941_initial',
  },
  {
    up: migration_20261113_070444_media_prefix.up,
    down: migration_20261113_070444_media_prefix.down,
    name: '20261113_070444_media_prefix',
  },
  {
    up: migration_20261119_155814_mcp_api_keys.up,
    down: migration_20261119_155814_mcp_api_keys.down,
    name: '20261119_155814_mcp_api_keys'
  },
];
