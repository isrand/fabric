import { common, ledger, msp, peer } from '@hyperledger/fabric-protos'
import { Block, EndorserTransaction, NamespaceReadWriteSet, Payload, ReadWriteSet, Transaction } from './interfaces/BlockInterfaces'

export class BlockDecoder {

	public static decode(blockProto: common.Block): Block {
		let blockNumber: number | undefined = blockProto.getHeader()?.getNumber();
		let blockMetadata: common.BlockMetadata | undefined = blockProto.getMetadata();
	
		if (!blockNumber) {
			throw new Error('Error fetching block number');
		}

		const blockValidationCodes = blockMetadata.getMetadataList_asU8()[common.BlockMetadataIndex.TRANSACTIONS_FILTER];
		const blockPayloads: common.Payload[] = this.getBlockPayloads(blockProto);
		const transactions: Transaction[] = [];
		for (const blockPayload of blockPayloads) {
			const index = blockPayloads.indexOf(blockPayload);
			const parsedPayload: Payload = this.parseBlockPayload(blockPayload, blockValidationCodes[index]);
			if (parsedPayload.isEndorserTransaction) {
				const transactionFromPayload = this.getTransactionFromPayload(parsedPayload);
				transactions.push(transactionFromPayload);
			}
		}
		return {
			blockNumber: blockNumber,
			transactions: transactions
		};
	}

	private static getBlockPayloads(blockProto: common.Block): common.Payload[] {
		const blockData = blockProto.getData()?.getDataList_asU8() ?? [];
		const deserializedBinaryEnvelope = blockData.map((bytes: Uint8Array) => common.Envelope.deserializeBinary(bytes));
		const envelopePayloadAsUint8Array = deserializedBinaryEnvelope.map((envelope: common.Envelope) => envelope.getPayload_asU8());
		const deserializedBinaryPayloads = envelopePayloadAsUint8Array.map((bytes: Uint8Array) => common.Payload.deserializeBinary(bytes));

		return deserializedBinaryPayloads;
	}

	private static parseBlockPayload(blockPayload: common.Payload, status: number): Payload {
		const blockPayloadHeader = blockPayload.getHeader();
		const channelHeader = common.ChannelHeader.deserializeBinary(blockPayloadHeader.getChannelHeader_asU8());
		const isEndorserTransaction: boolean = channelHeader.getType() === common.HeaderType.ENDORSER_TRANSACTION;
		const peerTransaction = peer.Transaction.deserializeBinary(blockPayload.getData_asU8());
		const endorserTransaction = this.parseEndorserTransaction(peerTransaction);
		const signatureHeader = common.SignatureHeader.deserializeBinary(blockPayloadHeader.getSignatureHeader_asU8());

		return {
			channelHeader: channelHeader,
			endorserTransaction: endorserTransaction,
			signatureHeader: signatureHeader,
			transactionValidationCode: status,
			isEndorserTransaction: isEndorserTransaction,
			isValid: status === peer.TxValidationCode.VALID
		};
	}

	private static parseEndorserTransaction(endorserTransaction: peer.Transaction): EndorserTransaction {
		const chaincodeActionPayloads: peer.TransactionAction[] = endorserTransaction.getActionsList();
		const transactionActionAsUInt8Array: Uint8Array[] = chaincodeActionPayloads.map((transactionAction) => transactionAction.getPayload_asU8());
		const deserializedBinaryChaincodeActionPayload: peer.ChaincodeActionPayload[] = transactionActionAsUInt8Array.map((bytes) => peer.ChaincodeActionPayload.deserializeBinary(bytes));
		
		const endorsedActions: Uint8Array[] = deserializedBinaryChaincodeActionPayload.map(endorsedAction => endorsedAction.getChaincodeProposalPayload_asU8());
		const deserializedBinaryEndorsedActions: peer.ProposalResponsePayload[]= endorsedActions.map((bytes: Uint8Array) => peer.ProposalResponsePayload.deserializeBinary(bytes));
		const deserializedBinaryResponsePayload: peer.ChaincodeAction[] = deserializedBinaryEndorsedActions.map((responsePayload: peer.ProposalResponsePayload) => peer.ChaincodeAction.deserializeBinary(responsePayload.getExtension_asU8()));
		const chaincodeActionsAsUInt8Array: Uint8Array[] = deserializedBinaryResponsePayload.map((chaincodeAction) => chaincodeAction.getResults_asU8());
		const deserializedBinaryTxReadWriteSet: ledger.rwset.TxReadWriteSet[] = chaincodeActionsAsUInt8Array.map((bytes: Uint8Array) => ledger.rwset.TxReadWriteSet.deserializeBinary(bytes));
		const parsedReadWriteSets: ReadWriteSet[]  = [];
		for (const txReadWriteSet of deserializedBinaryTxReadWriteSet) {
			const parsedReadWriteSet = this.parseReadWriteSet(txReadWriteSet);
			parsedReadWriteSets.push(parsedReadWriteSet);
		}

		return {
			readWriteSets: parsedReadWriteSets
		}
	}

	private static parseReadWriteSet(readWriteSet: ledger.rwset.TxReadWriteSet): ReadWriteSet {
		const namespaceReadWriteSetList = readWriteSet.getNsRwsetList();
		const namespaceReadWriteSets = [];
		for (const namespaceReadWriteSet of namespaceReadWriteSetList) {
			const parsedNamespaceReadWriteSet = this.parseNamespaceReadWriteSet(namespaceReadWriteSet);
			namespaceReadWriteSets.push(parsedNamespaceReadWriteSet);
		}
		return {
			namespaceReadWriteSets: namespaceReadWriteSets
		};
	}

	private static parseNamespaceReadWriteSet(nsReadWriteSet: ledger.rwset.NsReadWriteSet): NamespaceReadWriteSet {
		const namespace = nsReadWriteSet.getNamespace();
		const readWriteSet = ledger.rwset.kvrwset.KVRWSet.deserializeBinary(nsReadWriteSet.getRwset_asU8());
		return {
			namespace: namespace,
			readWriteSet: readWriteSet
		};
	}

	private static getTransactionFromPayload(payload: Payload): Transaction {
		const channelHeader = payload.channelHeader;
		const creatorBytes = payload.signatureHeader.getCreator_asU8();
		const creatorIdentity = msp.SerializedIdentity.deserializeBinary(creatorBytes);
		const creator = {
			mspId: creatorIdentity.getMspid(),
			credentials: creatorIdentity.getIdBytes_asU8()
		};
		const transaction = payload.endorserTransaction;
		const namespaceReadWriteSets = transaction.readWriteSets.flatMap((readWriteSet: ReadWriteSet) => readWriteSet.namespaceReadWriteSets);

		return {
			channelHeader: channelHeader,
			creator: creator,
			namespaceReadWriteSets: namespaceReadWriteSets,
			validationCode: payload.transactionValidationCode,
			isValid: payload.isValid
		}
	}
}