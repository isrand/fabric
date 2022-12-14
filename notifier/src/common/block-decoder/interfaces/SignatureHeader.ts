import { Identity } from './Identity';

export interface SignatureHeader {
  creator: Identity;
  nonce: string | Uint8Array;
}
