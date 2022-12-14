import { ChaincodeEvent } from './ChaincodeEvent';
import { ChaincodeId } from './ChaincodeId';
import { ReadWriteSet } from './ReadWriteSet';
import { Response } from './Response';

export interface ChaincodeAction {
  results: ReadWriteSet;
  events: ChaincodeEvent;
  response: Response | undefined;
  chaincodeId: ChaincodeId | undefined;
}
