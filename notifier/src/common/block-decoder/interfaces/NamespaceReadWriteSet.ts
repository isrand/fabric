import { CollectionPvtReadWriteSet } from './CollectionPvtReadWriteSet';

export interface NamespaceReadWriteSet {
  namespace: string;
  collectionPvtRwSet: CollectionPvtReadWriteSet[];
}
