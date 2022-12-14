import { common, ledger, msp, peer } from '@hyperledger/fabric-protos';
import { Block } from './interfaces/Block';
import { BlockData } from './interfaces/BlockData';
import { ChannelHeader } from './interfaces/ChannelHeader';
import { Envelope } from './interfaces/Envelope';
import { PayloadHeader } from './interfaces/PayloadHeader';
import { Identity } from './interfaces/Identity';
import { SignatureHeader } from './interfaces/SignatureHeader';
import { EndorserTransaction } from './interfaces/EndorserTransaction';
import { ChaincodeActionPayload } from './interfaces/ChaincodeActionPayload';
import { ChaincodeProposalPayload } from './interfaces/ChaincodeProposalPayload';
import { ChaincodeEndorsedAction } from './interfaces/ChaincodeEndorsedAction';
import { ProposalResponsePayload } from './interfaces/ProposalResponsePayload';
import { ChaincodeAction } from './interfaces/ChaincodeAction';
import { CommonDecoder } from './CommonDecoder';
import { ReadWriteSet } from './interfaces/ReadWriteSet';
import { ChaincodeEvent } from './interfaces/ChaincodeEvent';
import { Response } from './interfaces/Response';
import { HashedRWSet } from './interfaces/HashedRWSet';
import { CollectionHashedRWSet } from './interfaces/CollectionHashedRWSet';
import { ChaincodeId } from './interfaces/ChaincodeId';
import { KVReadHash } from './interfaces/KVReadHash';
import { KVReadHashVersion } from './interfaces/KVReadHashVersion';
import { KVWriteHash } from './interfaces/KVWriteHash';
import { KVMetadataEntry } from './interfaces/KVMetadataEntry';
import { KVMetadataWriteHash } from './interfaces/KVMetadataWriteHash';
import { Endorsement } from './interfaces/Endorsement';
import { TransactionAction } from './interfaces/TransactionAction';

export class BlockDecoder extends CommonDecoder {

  public constructor(private blockProtocolBuffer: common.Block) {
    super();
  }

  public decode(): Block {
    return {
      header: {
        number: this.blockProtocolBuffer.getHeader()?.getNumber(),
        previousHash: this.blockProtocolBuffer.getHeader()?.getPreviousHash(),
        dataHash: this.blockProtocolBuffer.getHeader()?.getDataHash()
      },
      data: this.decodeBlockData(this.blockProtocolBuffer.getData()),
      metadata: {}
    };
  }

  private decodeBlockData(blockDataProtocolBuffer: common.BlockData | undefined): BlockData | undefined {
    if (!blockDataProtocolBuffer) {
      return undefined;
    }

    const data: BlockData = {
      data: []
    };

    for (const dataBuffer of blockDataProtocolBuffer.getDataList_asU8()) {
      const envelopeProtobuf: common.Envelope = common.Envelope.deserializeBinary(dataBuffer);
      const envelope = this.decodeBlockDataEnvelope(envelopeProtobuf);
      data.data.push(envelope);
    }

    return data;
  }

  private decodeBlockDataEnvelope(envelopeProtocolBuffer: common.Envelope): Envelope {
    const payloadProto = common.Payload.deserializeBinary(envelopeProtocolBuffer.getPayload_asU8());
    const payloadHeader: PayloadHeader | undefined = this.decodeHeader(payloadProto.getHeader());

    if (!payloadHeader) {
      throw new Error('Could not decode payload header');
    }

    let payloadData: EndorserTransaction | undefined;

    switch (payloadHeader.channelHeader.type) {
      case 3:
        payloadData = this.decodeEndorserTransaction(payloadProto.getData_asU8());

        break;
      default:
        payloadData = undefined;
    }

    const envelope: Envelope = {
      signature: envelopeProtocolBuffer.getSignature(),
      payload: {
        header: payloadHeader,
        data: payloadData
      }
    };

    return envelope;
  }

  private decodeHeader(headerProtocolBuffer: common.Header | undefined): PayloadHeader | undefined {
    if (!headerProtocolBuffer) {
      return undefined;
    }

    return {
      channelHeader: this.decodeChannelheader(headerProtocolBuffer.getChannelHeader_asU8()),
      signatureHeader: this.decodeSignatureHeader(headerProtocolBuffer.getSignatureHeader_asU8())
    };
  }

  private decodeChannelheader(channelHeaderUint8Array: Uint8Array): ChannelHeader {
    const channelHeaderProtocolBuffer: common.ChannelHeader = common.ChannelHeader.deserializeBinary(channelHeaderUint8Array);
    const channelHeader: ChannelHeader = {
      type: channelHeaderProtocolBuffer.getType(),
      version: channelHeaderProtocolBuffer.getVersion(),
      timestamp: channelHeaderProtocolBuffer.getTimestamp(),
      channelId: channelHeaderProtocolBuffer.getChannelId(),
      transactionId: channelHeaderProtocolBuffer.getTxId(),
      epoch: channelHeaderProtocolBuffer.getEpoch(),
      extension: channelHeaderProtocolBuffer.getExtension_asU8()
    };

    return channelHeader;
  }

  private decodeSignatureHeader(signatureHeaderUint8Array: Uint8Array): SignatureHeader {
    const signatureHeaderProtocolBuffer: common.SignatureHeader = common.SignatureHeader.deserializeBinary(signatureHeaderUint8Array);

    return {
      creator: this.decodeIdentity(signatureHeaderProtocolBuffer.getCreator_asU8()),
      nonce: signatureHeaderProtocolBuffer.getNonce()
    };
  }

  private decodeIdentity(creatorUint8Array: Uint8Array): Identity {
    const identityProtocolBuffer: msp.SerializedIdentity = msp.SerializedIdentity.deserializeBinary(creatorUint8Array);

    return {
      mspId: identityProtocolBuffer.getMspid(),
      idBytes: identityProtocolBuffer.getIdBytes()
    };
  }

  private decodeEndorserTransaction(transactionEnvelopeUint8Array: Uint8Array): EndorserTransaction {
    const transactionProtocolBuffer = peer.Transaction.deserializeBinary(transactionEnvelopeUint8Array);
    const transactionActions = [];

    for (const actionProtocolBuffer of transactionProtocolBuffer.getActionsList()) {
      const transactionAction: TransactionAction = {
        header: this.decodeSignatureHeader(actionProtocolBuffer.getHeader_asU8()),
        payload: this.decodeChaincodeActionPayload(actionProtocolBuffer.getPayload_asU8())
      };
      transactionActions.push(transactionAction);
    }

    return {
      actions: transactionActions
    };
  }

  private decodeChaincodeActionPayload(chaincodeActionPayloadUint8Array: Uint8Array): ChaincodeActionPayload {
    const chaincodeActionPayloadProtocolBuffer = peer.ChaincodeActionPayload.deserializeBinary(chaincodeActionPayloadUint8Array);

    return {
      chaincodeProposalPayload: this.decodeChaincodeProposalPayload(chaincodeActionPayloadProtocolBuffer.getChaincodeProposalPayload_asU8()),
      action: this.decodeChaincodeEndorsedAction(chaincodeActionPayloadProtocolBuffer.getAction())
    };
  }

  private decodeChaincodeProposalPayload(chaincodeProposalPayloadUint8Array: Uint8Array): ChaincodeProposalPayload {
    const chaincodeProposalPayloadProtocolBuffer = peer.ChaincodeProposalPayload.deserializeBinary(chaincodeProposalPayloadUint8Array);

    return {
      input: chaincodeProposalPayloadProtocolBuffer.getInput_asU8()
    };
  }

  private decodeChaincodeEndorsedAction(chaincodeEndorsedActionProtocolBuffer: peer.ChaincodeEndorsedAction | undefined): ChaincodeEndorsedAction {
    if (!chaincodeEndorsedActionProtocolBuffer) {
      throw new Error('Chaincode has no endorsed action');
    }

    const endorsements = [];

    for (const endorsementProtocolBuffer of chaincodeEndorsedActionProtocolBuffer.getEndorsementsList()) {
      const endorsement: Endorsement = {
        endorser: this.decodeIdentity(endorsementProtocolBuffer.getEndorser_asU8()),
        signature: endorsementProtocolBuffer.getSignature()
      }
      endorsements.push(endorsement);
    }

    return {
      proposalResponsePayload: this.decodeProposalResponsePayload(chaincodeEndorsedActionProtocolBuffer.getProposalResponsePayload_asU8()),
      endorsements: endorsements
    };
  }

  private decodeProposalResponsePayload(proposalResponsePayloadUint8Array: Uint8Array): ProposalResponsePayload {
    const proposalResponsePayloadProtocolBuffer: peer.ProposalResponsePayload = peer.ProposalResponsePayload.deserializeBinary(proposalResponsePayloadUint8Array);

    return {
      proposalHash: proposalResponsePayloadProtocolBuffer.getProposalHash(),
      extension: this.decodeChaincodeAction(proposalResponsePayloadProtocolBuffer.getExtension_asU8())
    };
  }

  private decodeChaincodeAction(chaincodeActionUint8Array: Uint8Array): ChaincodeAction {
    const chaincodeActionProtocolBuffer: peer.ChaincodeAction = peer.ChaincodeAction.deserializeBinary(chaincodeActionUint8Array);

    return {
      results: this.decodeReadWriteSets(chaincodeActionProtocolBuffer.getResults_asU8()),
      events: this.decodeChaincodeEvent(chaincodeActionProtocolBuffer.getEvents_asU8()),
      response: this.decodeResponse(chaincodeActionProtocolBuffer.getResponse()),
      chaincodeId: this.decodeChaincodeId(chaincodeActionProtocolBuffer.getChaincodeId())
    };
  }

  private decodeReadWriteSets(readWriteSetsUint8Array: Uint8Array): ReadWriteSet {
    const readWriteSetProtocolBuffer = ledger.rwset.TxReadWriteSet.deserializeBinary(readWriteSetsUint8Array);
    let nsRwSets = [];

    if (readWriteSetProtocolBuffer.getDataModel() === ledger.rwset.TxReadWriteSet.DataModel.KV) {
      for (const nsReadWriteSet of readWriteSetProtocolBuffer.getNsRwsetList()) {
        nsRwSets.push({
          namespace: nsReadWriteSet.getNamespace(),
          rwset: this.decodeKVRWSet(nsReadWriteSet.getRwset_asU8()),
          collectionHashedRWSet: this.decodeCollectionHashedRWSet(nsReadWriteSet.getCollectionHashedRwsetList())
        });
      }
    } else {
      nsRwSets = readWriteSetProtocolBuffer.getNsRwsetList();
    }

    return {
      dataModel: readWriteSetProtocolBuffer.getDataModel(),
      namespaceReadWriteSet: nsRwSets
    };
  }

  private decodeCollectionHashedRWSet(collectionHashedRWSetArray:ledger.rwset.CollectionHashedReadWriteSet[]): CollectionHashedRWSet[] {
    const collectionHashedRWSets: CollectionHashedRWSet[] = [];

    for (const collectionHashedRWSet of collectionHashedRWSetArray) {
      collectionHashedRWSets.push({
        collectionName: collectionHashedRWSet.getCollectionName(),
        hashedRWSet: this.decodeHashedRWSet(collectionHashedRWSet.getHashedRwset_asU8()),
        pvtRWSetHash: collectionHashedRWSet.getPvtRwsetHash()
      });
    }

    return collectionHashedRWSets;
  }

  private decodeHashedRWSet(hashedRWSetUint8Array: Uint8Array): HashedRWSet {
    const hashedRWSetProtocolBuffer = ledger.rwset.kvrwset.HashedRWSet.deserializeBinary(hashedRWSetUint8Array);
    const hashedReads: KVReadHash[] = [];

    for (const kvReadHashProtocolBuffer of hashedRWSetProtocolBuffer.getHashedReadsList()) {
      hashedReads.push(this.decodeKVReadHash(kvReadHashProtocolBuffer));
    }

    const hashedWrites = [];

    for (const kvWriteHashProtocolBuffer of hashedRWSetProtocolBuffer.getHashedWritesList()) {
      hashedWrites.push(this.decodeKVWriteHash(kvWriteHashProtocolBuffer));
    }

    const hashedMetadataWrites = [];

    for (const kvWMetadataWriteHashProtocolBuffer of hashedRWSetProtocolBuffer.getMetadataWritesList()) {
      hashedMetadataWrites.push(this.decodeKVMetadataWriteHash(kvWMetadataWriteHashProtocolBuffer));
    }

    return {
      hashedReads: hashedReads,
      hashedWrites: hashedWrites,
      metadataWrites: hashedMetadataWrites
    };
  }

  private decodeChaincodeEvent(chaincodeEventUint8Array: Uint8Array): ChaincodeEvent {
    const chaincodeEventProtocolBuffer = peer.ChaincodeEvent.deserializeBinary(chaincodeEventUint8Array);

    return {
      chaincodeId: chaincodeEventProtocolBuffer.getChaincodeId(),
      transactionId: chaincodeEventProtocolBuffer.getTxId(),
      eventName: chaincodeEventProtocolBuffer.getEventName(),
      payload: chaincodeEventProtocolBuffer.getPayload_asU8()
    };
  }

  private decodeResponse(responseProtocolBuffer: peer.Response | undefined): Response | undefined {
    if (!responseProtocolBuffer) {
      return undefined;
    }

    return {
      status: responseProtocolBuffer.getStatus(),
      message: responseProtocolBuffer.getMessage(),
      payload: responseProtocolBuffer.getPayload_asU8()
    };
  }

  private decodeChaincodeId(chaincodeId: peer.ChaincodeID | undefined): ChaincodeId | undefined {
    if (!chaincodeId) {
      return undefined;
    }

    return {
      path: chaincodeId.getPath(),
      name: chaincodeId.getName(),
      version: chaincodeId.getVersion()
    };
  }

  private decodeKVReadHash(kvReadHashProtocolBuffer: ledger.rwset.kvrwset.KVReadHash): KVReadHash {
    return {
      keyHash: kvReadHashProtocolBuffer.getKeyHash(),
      version: this.decodeKVReadHashVersion(kvReadHashProtocolBuffer.getVersion())
    };
  }

  private decodeKVWriteHash(kvWriteHashProtocolBuffer: ledger.rwset.kvrwset.KVWriteHash): KVWriteHash {
    return {
      keyHash: kvWriteHashProtocolBuffer.getKeyHash(),
      isDelete: kvWriteHashProtocolBuffer.getIsDelete(),
      valueHash: kvWriteHashProtocolBuffer.getValueHash()
    };
  }

  private decodeKVMetadataWriteHash(kvMetadataWriteHashProtocolBuffer: ledger.rwset.kvrwset.KVMetadataWriteHash): KVMetadataWriteHash {
    const entries: KVMetadataEntry[] = [];

    for (const kvMetadataEntryProtocolBuffer of kvMetadataWriteHashProtocolBuffer.getEntriesList()) {
      entries.push(this.decodeKVMetadataEntry(kvMetadataEntryProtocolBuffer));
    }

    return {
      keyHash: kvMetadataWriteHashProtocolBuffer.getKeyHash(),
      entries: entries
    };
  }

  private decodeKVReadHashVersion(kvReadHashVersionProtocolBuffer: ledger.rwset.kvrwset.Version | undefined): KVReadHashVersion | undefined {
    if (!kvReadHashVersionProtocolBuffer) {
      return undefined;
    }

    return {
      blockNumber: kvReadHashVersionProtocolBuffer.getBlockNum(),
      transactionNumber: kvReadHashVersionProtocolBuffer.getTxNum()
    };
  }
}
