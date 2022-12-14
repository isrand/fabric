import { ChaincodeAction } from './ChaincodeAction';

export interface ProposalResponsePayload {
  proposalHash: string | Uint8Array;
  extension: ChaincodeAction;
}
