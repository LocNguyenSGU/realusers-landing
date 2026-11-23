import * as migration_20261111_142941_initial from './20261111_142941_initial';
import * as migration_20261113_070444_media_prefix from './20261113_070444_media_prefix';
import * as migration_20261119_155814_mcp_api_keys from './20261119_155814_mcp_api_keys';
import * as migration_20261122_100447_mcp_save_category_tool from './20261122_100447_mcp_save_category_tool';
import * as migration_20261123_080000_app_root_links from './20261123_080000_app_root_links';

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
    name: '20261119_155814_mcp_api_keys',
  },
  {
    up: migration_20261122_100447_mcp_save_category_tool.up,
    down: migration_20261122_100447_mcp_save_category_tool.down,
    name: '20261122_100447_mcp_save_category_tool'
  },
  {
    up: migration_20261123_080000_app_root_links.up,
    down: migration_20261123_080000_app_root_links.down,
    name: '20261123_080000_app_root_links',
  },
];
