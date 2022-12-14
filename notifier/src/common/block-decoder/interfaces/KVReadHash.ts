import { KVReadHashVersion } from './KVReadHashVersion';

export interface KVReadHash {
  keyHash: string | Uint8Array;
  version: KVReadHashVersion | undefined;
}
