export interface ChaincodeEvent {
  chaincodeId: string;
  transactionId: string;
  eventName: string;
  payload: Uint8Array;
}
