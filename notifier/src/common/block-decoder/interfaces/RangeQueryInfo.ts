import { RawReads } from './RawReads';
import { ReadsMerkleHashes } from './ReadsMerkleHashes';

export interface RangeQueryInfo {
  startkey: string;
  endKey: string;
  itrExhausted: boolean;
  rawReads: RawReads;
  readsMerkleHashes: ReadsMerkleHashes;
}
