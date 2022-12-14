import { HashedRWSet } from './HashedRWSet';

export interface CollectionHashedRWSet {
  collectionName: string;
  hashedRWSet: HashedRWSet;
  pvtRWSetHash: string | Uint8Array;
}
