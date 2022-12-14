import { EndorserTransaction } from './EndorserTransaction';
import { PayloadHeader } from './PayloadHeader';

export interface EnvelopePayload {
  header: PayloadHeader;
  data: EndorserTransaction | undefined;
}
