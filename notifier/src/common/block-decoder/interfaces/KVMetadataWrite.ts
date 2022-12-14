import { KVMetadataEntry } from './KVMetadataEntry';

export interface KVMetadataWrite {
  key: string;
  entries: KVMetadataEntry[];
}
