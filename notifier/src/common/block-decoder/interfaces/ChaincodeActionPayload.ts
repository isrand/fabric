import { ChaincodeEndorsedAction } from './ChaincodeEndorsedAction';
import { ChaincodeProposalPayload } from './ChaincodeProposalPayload';

export interface ChaincodeActionPayload {
  chaincodeProposalPayload: ChaincodeProposalPayload;
  action: ChaincodeEndorsedAction;
}
