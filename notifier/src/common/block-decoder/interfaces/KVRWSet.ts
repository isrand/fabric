import { KVMetadataWrite } from './KVMetadataWrite';
import { KVRead } from './KVRead';
import { KVWrite } from './KVWrite';
import { RangeQueryInfo } from './RangeQueryInfo';

export interface KVRWSet {
  reads: KVRead[];
  rangeQueriesInfo: RangeQueryInfo[];
  writes: KVWrite[];
  metadataWrites: KVMetadataWrite[];
}
