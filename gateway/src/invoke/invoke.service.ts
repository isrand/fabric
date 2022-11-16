import { Contract, Proposal, Status, SubmittedTransaction, Transaction } from '@hyperledger/fabric-gateway';
import { StatusNames } from '@hyperledger/fabric-gateway/dist/status';
import { ContractProvider } from '../common/contract.provider';
import { TransactionRequest } from '../common/transaction.request';
import { InvokeResponse } from './response/invoke.response';

export class InvokeService {
	private readonly maxRetries: number = 10;
	public constructor() {

	}

	public async invoke(invokeDto: TransactionRequest): Promise<InvokeResponse> {
		const contract: Contract = await new ContractProvider(invokeDto.channel, invokeDto.chaincode).getContract();
		const transactionProposal: Proposal = contract.newProposal(invokeDto.function, { arguments: invokeDto.params });

		let currentAttempt = 0;
		while (currentAttempt < this.maxRetries) {
			try {
				const endorsedTransaction: Transaction = await transactionProposal.endorse();
				const submittedTransaction: SubmittedTransaction = await endorsedTransaction.submit();
				const transactionResult: Status = await submittedTransaction.getStatus();
				
				return {
					blockNumber: Number(transactionResult.blockNumber),
					transactionId: transactionResult.transactionId,
					status: StatusNames[transactionResult.code]
				};
			} catch (error: unknown) {
				console.log('Could not connect to peer: ', error);
				await this.sleep(2);

				currentAttempt++;
			}
		}
	}

	private async sleep(seconds: number): Promise<void> {
		return new Promise((resolve) => {
			setTimeout(() => {
				resolve();
			}, seconds * 1000);
		});
	}
}