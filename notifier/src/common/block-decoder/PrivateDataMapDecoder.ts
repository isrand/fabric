import * as jspb from 'google-protobuf';
import { ledger } from '@hyperledger/fabric-protos';
import { CollectionPvtReadWriteSet } from './interfaces/CollectionPvtReadWriteSet';
import { NamespaceReadWriteSet } from './interfaces/NamespaceReadWriteSet';
import { TxPvtReadWriteSet } from './interfaces/TxPvtReadWriteSet';
import { CommonDecoder } from './CommonDecoder';

export class PrivateDataMapDecoder extends CommonDecoder {

  public constructor(private privateDataMapMapProtocolBuffer: jspb.Map<number, ledger.rwset.TxPvtReadWriteSet>) {
    super();
  }

  public decode(): Map<number, TxPvtReadWriteSet> {
    const privateDataMap: Map<number, TxPvtReadWriteSet> = new Map<number, TxPvtReadWriteSet>();

    for (let txIndex = 0; txIndex < this.privateDataMapMapProtocolBuffer.getLength(); txIndex++) {
      const txPvtReadWriteSetProto: ledger.rwset.TxPvtReadWriteSet | undefined = this.privateDataMapMapProtocolBuffer.get(txIndex);

      if (txPvtReadWriteSetProto) {
        const txPvtReadWriteSet: TxPvtReadWriteSet = {
          dataModel: txPvtReadWriteSetProto.getDataModel(),
          namespacePvtReadWriteSetArray: []
        };

        for (const nsPvtRwsetProto of txPvtReadWriteSetProto.getNsPvtRwsetList()) {
          const namespacePvtReadWriteSet: NamespaceReadWriteSet = {
            namespace: nsPvtRwsetProto.getNamespace(),
            collectionPvtRwSet: []
          };

          for (const collectionPvtRwsetProto of nsPvtRwsetProto.getCollectionPvtRwsetList()) {
            const collectionPvtReadWriteSet: CollectionPvtReadWriteSet = {
              collectionName: collectionPvtRwsetProto.getCollectionName(),
              readWriteSet: this.decodeKVRWSet(collectionPvtRwsetProto.getRwset() as Uint8Array)
            };
            namespacePvtReadWriteSet.collectionPvtRwSet.push(collectionPvtReadWriteSet);
          }

          txPvtReadWriteSet.namespacePvtReadWriteSetArray.push(namespacePvtReadWriteSet);
        }

        privateDataMap.set(txIndex, txPvtReadWriteSet);
      }
    }

    return privateDataMap;
  }
}
