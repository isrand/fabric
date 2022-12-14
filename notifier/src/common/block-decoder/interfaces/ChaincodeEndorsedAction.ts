import { Endorsement } from './Endorsement';
import { ProposalResponsePayload } from './ProposalResponsePayload';

export interface ChaincodeEndorsedAction {
  proposalResponsePayload: ProposalResponsePayload;
  endorsements: Endorsement[];
}
