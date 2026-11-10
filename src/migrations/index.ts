import * as migration_20261110_131446_initial from './20261110_131446_initial';

export const migrations = [
  {
    up: migration_20261110_131446_initial.up,
    down: migration_20261110_131446_initial.down,
    name: '20261110_131446_initial'
  },
];
