import { Contract } from '@hyperledger/fabric-gateway';
import { ContractProvider } from '../common/contract.provider';
import { TransactionRequest } from '../common/transaction.request';
import { QueryResponse } from './response/query.response';

export class QueryService {
	private readonly maxRetries: number = 10;
	public constructor() {

	}

	public async query(queryDto: TransactionRequest): Promise<QueryResponse> {
		const contract: Contract = await new ContractProvider(queryDto.channel, queryDto.chaincode).getContract();
		
		let currentAttempt = 0;
		while (currentAttempt < this.maxRetries) {
			try {
				const evaluatedTransaction = await contract.evaluateTransaction(queryDto.function, ...queryDto.params);
				const decodedTransaction = new TextDecoder().decode(evaluatedTransaction);

				return {
					payload: JSON.parse(decodedTransaction)
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