import { peer } from '@hyperledger/fabric-protos';
import { BlockDecoder } from './BlockDecoder';
import { BlockWithPrivateData } from './interfaces/BlockWithPrivateData';
import { PrivateDataMapDecoder } from './PrivateDataMapDecoder';

export class BlockAndPrivateDataDecoder {

  public constructor(private readonly blockAndPrivateData: peer.BlockAndPrivateData) {
  }

  public decode(): BlockWithPrivateData {
    const block = this.blockAndPrivateData.getBlock();

    if (!block) {
      throw new Error('Received an object without block');
    }

    if (this.hasPrivateData()) {
      const privateDataMap = this.blockAndPrivateData.getPrivateDataMapMap();

      return {
        block: new BlockDecoder(block).decode(),
        privateDataMap: new PrivateDataMapDecoder(privateDataMap).decode()
      };
    }

    return {
      block: new BlockDecoder(block).decode()
    };
  }

  private hasPrivateData(): boolean {
    return this.blockAndPrivateData.getPrivateDataMapMap().getLength() > 0;
  }
}
