import { Block, BlockData, BlockHeader, BlockMetadata, ChannelHeader, Envelope, Header, Payload, SignatureHeader, Metadata } from '@hyperledger/fabric-protos/lib/common';
import {
  ChaincodeAction,
  ChaincodeActionPayload,
  ChaincodeID,
  ChaincodeInvocationSpec,
  ChaincodeProposalPayload,
  Endorsement,
  ProposalResponsePayload,
  Transaction,
  TransactionAction,
} from '@hyperledger/fabric-protos/lib/peer';
import { SerializedIdentity } from '@hyperledger/fabric-protos/lib/msp';
import { X509 } from 'jsrsasign';
import { ChaincodeEndorsedAction } from '@hyperledger/fabric-protos/lib/peer/transaction_pb';
import { ChaincodeSpec } from '@hyperledger/fabric-protos/lib/peer/chaincode_pb';
import { TxReadWriteSet } from '@hyperledger/fabric-protos/lib/ledger/rwset';
import { NsReadWriteSet } from '@hyperledger/fabric-protos/lib/ledger/rwset/rwset_pb';
import { KVRWSet } from '@hyperledger/fabric-protos/lib/ledger/rwset/kvrwset';
import { KVMetadataEntry, KVMetadataWrite, KVRead, KVWrite, RangeQueryInfo } from '@hyperledger/fabric-protos/lib/ledger/rwset/kvrwset/kv_rwset_pb';
import { MetadataSignature } from '@hyperledger/fabric-protos/lib/common/common_pb';

export class BlockDecoder {
	public constructor(private block: Block) { }

	private decodeBlockDataEnvelope(envelope: Envelope): any {
		const decodedBlockDataEnvelope = {
			channelId: {},
			transactionId: {},
			headerType: {},
			payloadHeaderSignature: {},
			creatorMsp: {},
			creatorId: {},
			creatorIdX509Info: {},
			creatorIdX509Subject: {},
			endorsements: {},
			chaincodeSpecs: {},
			proposalResponseHash: {},
			txReadWriteSet: [],
		};
		const envPayload: Payload = Payload.deserializeBinary(envelope.getPayload_asU8());
		const headerPayload: Header = envPayload.getHeader();
		decodedBlockDataEnvelope.payloadHeaderSignature = headerPayload.getSignatureHeader_asB64();
		const channelHeader: ChannelHeader = ChannelHeader.deserializeBinary(headerPayload.getChannelHeader_asU8());
		const channelId: string = channelHeader.getChannelId();
		decodedBlockDataEnvelope.channelId = channelId;
		const transactionId = channelHeader.getTxId();
		decodedBlockDataEnvelope.transactionId = transactionId;
		const headerType = channelHeader.getType();
		decodedBlockDataEnvelope.headerType = headerType;
		if (headerType === 3) {
			const transaction: Transaction = Transaction.deserializeBinary(envPayload.getData_asU8());
			const transactionActions: TransactionAction[] = transaction.getActionsList();
			for (const transactionAction of transactionActions) {
				const signatureActionHeader = SignatureHeader.deserializeBinary(transactionAction.getHeader_asU8());
				const creator = SerializedIdentity.deserializeBinary(signatureActionHeader.getCreator_asU8());
				const msp = creator.getMspid();
				decodedBlockDataEnvelope.creatorMsp = msp;
				const creatorId = Buffer.from(creator.getIdBytes_asB64(), 'base64');
				decodedBlockDataEnvelope.creatorId = creatorId.toString();
				const certX509 = new X509();
				certX509.readCertPEM(creatorId.toString());
				decodedBlockDataEnvelope.creatorIdX509Info = certX509.getInfo();
				decodedBlockDataEnvelope.creatorIdX509Subject = certX509.getSubject();
				const chaincodeActionPayload = ChaincodeActionPayload.deserializeBinary(transactionAction.getPayload_asU8());
				const chaincodeEndorseAction: ChaincodeEndorsedAction = chaincodeActionPayload.getAction();
				if (chaincodeEndorseAction) {
					const endorsements: Array<Endorsement> = chaincodeEndorseAction.getEndorsementsList();
					const endorsementList = [];
					for (const endorsement of endorsements) {
						const endorsementInfo = { endorserId: {}, endorserIdX509Info: {}, endorserIdX509Subject: {}, endorserMsp: {}, endorserSignature: {} };
						const endorserIdentity = SerializedIdentity.deserializeBinary(endorsement.getEndorser_asU8());
						endorsementInfo.endorserSignature = endorsement.getSignature_asB64();
						const endorserId = Buffer.from(endorserIdentity.getIdBytes_asB64(), 'base64');
						endorsementInfo.endorserId = endorserId.toString();
						certX509.readCertPEM(endorserId.toString());
						endorsementInfo.endorserIdX509Info = certX509.getInfo();
						endorsementInfo.endorserIdX509Subject = certX509.getSubject();
						endorsementInfo.endorserMsp = endorserIdentity.getMspid();
	
						endorsementList.push(endorsementInfo);
					}
					decodedBlockDataEnvelope.endorsements = endorsementList;
				}
				const chaincodeProposalPayload = ChaincodeProposalPayload.deserializeBinary(chaincodeActionPayload.getChaincodeProposalPayload_asU8());
				const chaincodeInocationSpec = ChaincodeInvocationSpec.deserializeBinary(chaincodeProposalPayload.getInput_asU8());
				const chaincodeSpec: ChaincodeSpec = chaincodeInocationSpec.getChaincodeSpec();
				const chaincodeId: ChaincodeID = chaincodeSpec.getChaincodeId();
				const chaincodeSpecs = { chaincodeID: {}, chaincodeArguments: [] };
				const chaincodeID = { name: {}, path: {}, version: {} };
				chaincodeID.name = chaincodeId.getName();
				chaincodeID.path = chaincodeId.getPath();
				chaincodeID.version = chaincodeId.getVersion();
				chaincodeSpecs.chaincodeID = chaincodeID;
				const chaincodeInput = chaincodeSpec.getInput();
				const chaincodeArgs: Array<string> = chaincodeInput.getArgsList_asB64();
				if (chaincodeArgs) {
					let i = 0;
					for (const arg of chaincodeArgs) {
						const argBuffer = Buffer.from(arg, 'base64');
						try {
							chaincodeSpecs.chaincodeArguments.push(JSON.parse(argBuffer.toString('utf8')));
						} catch (e) {
							chaincodeSpecs.chaincodeArguments.push(argBuffer.toString('utf8'));
						}
					}
					decodedBlockDataEnvelope.chaincodeSpecs = chaincodeSpecs;
				}
				const proposalResponsePayload: ProposalResponsePayload = ProposalResponsePayload.deserializeBinary(chaincodeEndorseAction.getProposalResponsePayload_asU8());
				const proposalResponseHash = Buffer.from(proposalResponsePayload.getProposalHash_asB64(), 'base64').toString('hex');
				decodedBlockDataEnvelope.proposalResponseHash = proposalResponseHash;
				const extension = proposalResponsePayload.getExtension_asU8();
				const chaincodeAction = ChaincodeAction.deserializeBinary(extension);
				const results = chaincodeAction.getResults_asU8();
				const txReadWriteSet: TxReadWriteSet = TxReadWriteSet.deserializeBinary(results);
				const nsReadWriteSet: Array<NsReadWriteSet> = txReadWriteSet.getNsRwsetList();
	
				for (const rwSet of nsReadWriteSet) {
					const nsRWSet = { namespace: {}, kvReads: [], kvWrites: [], kvMetadataWrites: [], rangeQueryInfos: [] };
					const namespace = rwSet.getNamespace();
					nsRWSet.namespace = namespace;
					const kVRWSetProto = KVRWSet.deserializeBinary(rwSet.getRwset_asU8());
					const reads: Array<KVRead> = kVRWSetProto.getReadsList();
					for (const readSet of reads) {
						const kvRead = { key: {}, version: {} };
						kvRead.key = readSet.getKey();
						kvRead.version = readSet.getVersion();
						nsRWSet.kvReads.push(kvRead);
					}
					const rangeQueryInfoProto: Array<RangeQueryInfo> = kVRWSetProto.getRangeQueriesInfoList();
					for (const rangeQ of rangeQueryInfoProto) {
						const rangeQueryInfo = { startKey: {}, endKey: {} };
						rangeQueryInfo.startKey = rangeQ.getStartKey();
						rangeQueryInfo.endKey = rangeQ.getEndKey();
						nsRWSet.rangeQueryInfos.push(rangeQueryInfo);
					}
					const writes: Array<KVWrite> = kVRWSetProto.getWritesList();
					for (const write of writes) {
						const kvWrite = { key: {}, value: {} };
						kvWrite.key = write.getKey();
						const value = Buffer.from(write.getValue_asB64(), 'base64').toString();
						try {
							kvWrite.value = JSON.parse(value);
						} catch (e) {
							kvWrite.value = value;
						}
						nsRWSet.kvWrites.push(kvWrite);
					}
					const metadataWriltes: Array<KVMetadataWrite> = kVRWSetProto.getMetadataWritesList();
					for (const metadataWrite of metadataWriltes) {
						const kvMetadataWrite = { key: {}, entries: [] };
						kvMetadataWrite.key = metadataWrite.getKey();
						const metadataEntryList: Array<KVMetadataEntry> = metadataWrite.getEntriesList();
						for (const entry of metadataEntryList) {
							const ent = { name: {}, value: {} };
							const value = Buffer.from(entry.getValue_asB64(), 'base64').toString();
							try {
								ent.value = JSON.parse(value);
							} catch (e) {
								ent.value = value;
							}
							ent.name = entry.getName();
							kvMetadataWrite.entries.push(ent);
						}
						nsRWSet.kvMetadataWrites.push(kvMetadataWrite);
					}
					decodedBlockDataEnvelope.txReadWriteSet.push(nsRWSet);
				}
			}
		}
		return decodedBlockDataEnvelope;
	};

	public decode() {
		const decodedBlock = {
			blockNum: {} as number,
			dataHash: {} as string,
			dataHashAsB64: {} as string,
			dataHashAsString: {} as string,
			previousDataHash: {} as string,
			previousDataHashAsB64: {} as string,
			previousDataHashAsString: {} as string,
			decodedBlockDataEnvelopes: [],
			decodedBlockMetadata: [],
		};
		const blockHeader: BlockHeader = this.block.getHeader();
		const blockNum = blockHeader.getNumber();
		decodedBlock.blockNum = blockNum;
		const dataHash = blockHeader.getDataHash().toString();
		decodedBlock.dataHash = dataHash;
		const dataHashAsB64 = blockHeader.getDataHash_asB64();
		decodedBlock.dataHashAsB64 = dataHashAsB64;
		const dataHashAsString = Buffer.from(dataHashAsB64, 'base64').toString('hex');
		decodedBlock.dataHashAsString = dataHashAsString;
		const previousDataHash = blockHeader.getPreviousHash().toString();
		decodedBlock.previousDataHash = previousDataHash;
		const previousDataHashAsB64 = blockHeader.getPreviousHash_asB64();
		decodedBlock.previousDataHashAsB64 = previousDataHashAsB64;
		const previousDataHashAsString = Buffer.from(previousDataHashAsB64, 'base64').toString('hex');
		decodedBlock.previousDataHashAsString = previousDataHashAsString;
		const blockData: BlockData = this.block.getData();
		const blockDataList = blockData.getDataList_asU8();
		if (blockDataList.length > 0) {
			for (const bl of blockDataList) {
				if (bl.length > 0) {
					const envelope = Envelope.deserializeBinary(bl);
					const decodedBlockDataEnvelope = this.decodeBlockDataEnvelope(envelope);
					decodedBlock.decodedBlockDataEnvelopes.push(decodedBlockDataEnvelope);
				} else {

				}
			}
		}
		const blockMetaData: BlockMetadata = this.block.getMetadata();
		const blockMetaDataList: Array<Uint8Array> = blockMetaData.getMetadataList_asU8();
		const metadataProtoSignatures = blockMetaDataList[0];
		const metadata: Metadata = Metadata.deserializeBinary(metadataProtoSignatures);
		const metadataSignature = { value: {}, signatures: [] };
		const value = metadata.getValue_asB64();
		metadataSignature.value = value;
		const metadataSignatures: Array<MetadataSignature> = metadata.getSignaturesList();
		for (const metadataSig of metadataSignatures) {
			const metadataSign = { nonce: {}, blockSignerMsp: {}, blockSignerX509Info: {}, blockSignerX509Subject: {}, blockSignerCertificate: {}, blockSignerSignature: {} };
			const sigHeader: SignatureHeader = SignatureHeader.deserializeBinary(metadataSig.getSignatureHeader_asU8());
			const signerNonce = sigHeader.getNonce_asB64();
			const signer: SerializedIdentity = SerializedIdentity.deserializeBinary(sigHeader.getCreator_asU8());
			const signerMsp = signer.getMspid();
			const signerId = Buffer.from(signer.getIdBytes_asB64(), 'base64');
			const certX509 = new X509();
			certX509.readCertPEM(signerId.toString());
			metadataSign.nonce = signerNonce;
			metadataSign.blockSignerMsp = signerMsp;
			metadataSign.blockSignerX509Info = certX509.getInfo();
			metadataSign.blockSignerX509Subject = certX509.getSubject();
			metadataSign.blockSignerCertificate = signerId.toString();
			metadataSign.blockSignerSignature = metadataSig.getSignature_asB64();
			metadataSignature.signatures.push(metadataSign);
		}
		decodedBlock.decodedBlockMetadata.push(metadataSignature);
		const metadataProto1 = blockMetaDataList[1];
		decodedBlock.decodedBlockMetadata.push(metadataProto1);
		const metadataProto2 = blockMetaDataList[2];
		const transactionFilter = { transactionFilter: {} };
		transactionFilter.transactionFilter = metadataProto2;
		decodedBlock.decodedBlockMetadata.push(transactionFilter);
		const metadataProto3 = blockMetaDataList[3];
		decodedBlock.decodedBlockMetadata.push(metadataProto3);
		const metadataProto4 = blockMetaDataList[4];
		const commitHash = {
			commitHashB64: {},
		};
		commitHash.commitHashB64 = Buffer.from(metadataProto4).toString('base64');
		decodedBlock.decodedBlockMetadata.push(commitHash);
	
		return decodedBlock;
	}
}