import { ledger } from '@hyperledger/fabric-protos';

export interface KVRead {
  key: string;
  version: ledger.rwset.kvrwset.Version | undefined;
}
