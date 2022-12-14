export interface ChannelHeader {
  type: number;
  version: number;
  timestamp: Date;
  channelId: string;
  transactionId: string;
  epoch: number;
  extension: Uint8Array;
}
