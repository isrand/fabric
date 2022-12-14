import { EnvelopePayload } from './EnvelopePayload';

export interface Envelope {
  signature: string | Uint8Array;
  payload: EnvelopePayload;
}
