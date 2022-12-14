import { ChaincodeActionPayload } from './ChaincodeActionPayload';
import { SignatureHeader } from './SignatureHeader';

export interface TransactionAction {
	header: SignatureHeader;
	payload: ChaincodeActionPayload;
}