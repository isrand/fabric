import { KVMetadataWriteHash } from './KVMetadataWriteHash';
import { KVReadHash } from './KVReadHash';
import { KVWriteHash } from './KVWriteHash';

export interface HashedRWSet {
  hashedReads: KVReadHash[];
  hashedWrites: KVWriteHash[];
  metadataWrites: KVMetadataWriteHash[];
}
