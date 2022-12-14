import { KVRWSet } from './KVRWSet';

export interface CollectionPvtReadWriteSet {
  collectionName: string;
  readWriteSet: KVRWSet;
}
