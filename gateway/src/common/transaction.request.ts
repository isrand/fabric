import { ApiProperty } from '@nestjs/swagger';

export class TransactionRequest {
	@ApiProperty({
		description: 'Name of the channel where the transaction will occur',
		example: 'test-channel',
		required: true,
		type: String
	})
  channel: string;

	@ApiProperty({
		description: 'Name of the chaincode',
		example: 'asset-transfer-chaincode',
		required: true,
		type: String
	})
  chaincode: string;

	@ApiProperty({
		description: 'Chaincode function to invoke',
		example: 'initLedger',
		required: true,
		type: String
	})
  function: string;

	@ApiProperty({
		description: 'Parameters to pass to the function',
		example: '[]',
		required: true,
		type: Array<string>
	})
  params: string[];
}
