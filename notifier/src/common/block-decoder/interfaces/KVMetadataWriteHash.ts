import { KVMetadataEntry } from './KVMetadataEntry';

export interface KVMetadataWriteHash {
  keyHash: string | Uint8Array;
  entries: KVMetadataEntry[];
}
