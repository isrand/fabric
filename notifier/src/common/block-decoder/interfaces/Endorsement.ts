import { Identity } from './Identity';

export interface Endorsement {
	endorser: Identity;
	signature: string | Uint8Array;
}
