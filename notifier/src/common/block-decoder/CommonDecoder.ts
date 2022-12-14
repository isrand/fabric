import { KVMetadataWrite } from './interfaces/KVMetadataWrite';
import { KVRead } from './interfaces/KVRead';
import { KVRWSet } from './interfaces/KVRWSet';
import { KVWrite } from './interfaces/KVWrite';
import { RangeQueryInfo } from './interfaces/RangeQueryInfo';
import { ledger } from '@hyperledger/fabric-protos';
import { KVMetadataEntry } from './interfaces/KVMetadataEntry';

export class CommonDecoder {

  protected decodeKVRWSet(kVReadWriteSetProtocolBuffer: Uint8Array): KVRWSet {
    const kvRWSetProto = ledger.rwset.kvrwset.KVRWSet.deserializeBinary(kVReadWriteSetProtocolBuffer);
    const kvRWset: KVRWSet = {
      reads: [],
      rangeQueriesInfo: [],
      writes: [],
      metadataWrites: []
    };

    for (const kvReadProto of kvRWSetProto.getReadsList()) {
      const decodedKVReadProto: KVRead = this.decodeKVRead(kvReadProto);
      kvRWset.reads.push(decodedKVReadProto);
    }

    for (const rangeQueryInfoProto of kvRWSetProto.getRangeQueriesInfoList()) {
      const decodedRangeQueryInfo: RangeQueryInfo = this.decodeRangeQueryInfo(rangeQueryInfoProto);
      kvRWset.rangeQueriesInfo.push(decodedRangeQueryInfo);
    }

    for (const kVWriteProto of kvRWSetProto.getWritesList()) {
      const decodedKVWrite: KVWrite = this.decodeKVWrite(kVWriteProto);
      kvRWset.writes.push(decodedKVWrite);
    }

    for (const kVMetadataWriteProto of kvRWSetProto.getMetadataWritesList()) {
      const decodedKVMetadataWrite: KVMetadataWrite = this.decodeKVMetadataWrite(kVMetadataWriteProto);
      kvRWset.metadataWrites.push(decodedKVMetadataWrite);
    }

    return kvRWset;
  }

  protected decodeRangeQueryInfo(rangeQueryInfoProto: ledger.rwset.kvrwset.RangeQueryInfo): RangeQueryInfo {
    const rangeQueryInfo: RangeQueryInfo = {
      startkey: rangeQueryInfoProto.getStartKey(),
      endKey: rangeQueryInfoProto.getEndKey(),
      itrExhausted: rangeQueryInfoProto.getItrExhausted(),
      rawReads: {
        kvReads: []
      },
      readsMerkleHashes: {
        maxDegree: undefined,
        maxLevel: undefined,
        maxLevelhashes: []
      }
    };

    if (rangeQueryInfoProto.getRawReads()) {
      const rawReads = rangeQueryInfoProto.getRawReads();

      if (rawReads) {
        for (const kVReadProto of rawReads.getKvReadsList()) {
          rangeQueryInfo.rawReads.kvReads.push(this.decodeKVRead(kVReadProto));
        }
      }
    } else if (rangeQueryInfoProto.getReadsMerkleHashes()) {
      rangeQueryInfo.readsMerkleHashes = {
        maxDegree: rangeQueryInfoProto.getReadsMerkleHashes()?.getMaxDegree(),
        maxLevel: rangeQueryInfoProto.getReadsMerkleHashes()?.getMaxLevel(),
        maxLevelhashes: rangeQueryInfoProto.getReadsMerkleHashes()?.getMaxLevelHashesList()
      };
    }

    return rangeQueryInfo;
  }

  protected decodeKVWrite(kVWriteProto: ledger.rwset.kvrwset.KVWrite): KVWrite {
    return {
      key: kVWriteProto.getKey(),
      isDelete: kVWriteProto.getIsDelete(),
      value: kVWriteProto.getValue_asU8(),
    };
  }

  protected decodeKVMetadataWrite(kVMetadataWriteProto: ledger.rwset.kvrwset.KVMetadataWrite): KVMetadataWrite {
    const kvMetadataWrite: KVMetadataWrite = {
      key: kVMetadataWriteProto.getKey(),
      entries: []
    };

    for (const kVMetadataEntryProto of kVMetadataWriteProto.getEntriesList()) {
      kvMetadataWrite.entries.push(this.decodeKVMetadataEntry(kVMetadataEntryProto));
    }

    return kvMetadataWrite;
  }

  protected decodeKVRead(kvReadProto: ledger.rwset.kvrwset.KVRead): KVRead {
    return {
      key: kvReadProto.getKey(),
      version: kvReadProto.getVersion()
    };
  }

  protected decodeKVMetadataEntry(kVMetadataWriteProto: ledger.rwset.kvrwset.KVMetadataEntry): KVMetadataEntry {
    return {
      name: kVMetadataWriteProto.getName(),
      value: kVMetadataWriteProto.getValue()
    };
  }
}
