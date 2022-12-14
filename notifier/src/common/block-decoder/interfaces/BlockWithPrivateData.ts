import { Block } from './Block';
import { TxPvtReadWriteSet } from './TxPvtReadWriteSet';

export interface BlockWithPrivateData {
  block: Block;
  privateDataMap?: Map<number, TxPvtReadWriteSet>;
}
