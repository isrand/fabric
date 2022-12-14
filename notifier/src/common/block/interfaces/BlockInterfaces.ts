import { Identity } from '@hyperledger/fabric-gateway';
import { common, ledger } from '@hyperledger/fabric-protos';

export interface Block {
  blockNumber: number;
  transactions: Transaction[]
}

export interface Transaction {
  channelHeader: common.ChannelHeader;
  creator: Identity;
  validationCode: number;
  isValid: boolean;
  namespaceReadWriteSets: NamespaceReadWriteSet[];
}

export interface NamespaceReadWriteSet {
  namespace: string;
  readWriteSet: ledger.rwset.kvrwset.KVRWSet;
}

export interface Payload {
  channelHeader: common.ChannelHeader;
  endorserTransaction: EndorserTransaction;
  signatureHeader: common.SignatureHeader;
  transactionValidationCode: number;
  isEndorserTransaction: boolean;
  isValid: boolean;
}

export interface EndorserTransaction {
  readWriteSets: ReadWriteSet[];
}

export interface ReadWriteSet {
  namespaceReadWriteSets: NamespaceReadWriteSet[];
}