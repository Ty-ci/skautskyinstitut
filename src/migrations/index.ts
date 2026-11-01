import * as migration_20261001_223928_initial from './20261001_223928_initial';

export const migrations = [
  {
    up: migration_20261001_223928_initial.up,
    down: migration_20261001_223928_initial.down,
    name: '20261001_223928_initial'
  },
];
