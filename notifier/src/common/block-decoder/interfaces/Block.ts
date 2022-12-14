import { BlockData } from './BlockData';
import { BlockHeader } from './BlockHeader';

export interface Block {
  header: BlockHeader;
  data: BlockData | undefined;
  metadata: any | undefined;
}
