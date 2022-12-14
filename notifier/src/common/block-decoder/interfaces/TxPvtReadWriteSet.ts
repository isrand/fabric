import { NamespaceReadWriteSet } from './NamespaceReadWriteSet';

export interface TxPvtReadWriteSet {
  dataModel: number;
  namespacePvtReadWriteSetArray: NamespaceReadWriteSet[];
}
