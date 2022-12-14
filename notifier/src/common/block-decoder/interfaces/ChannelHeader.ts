import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';

export interface ChannelHeader {
  type: number;
  version: number;
  timestamp: Timestamp;
  channelId: string;
  transactionId: string;
  epoch: number;
  extension: Uint8Array;
}
