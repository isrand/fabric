import { ChannelHeader } from './ChannelHeader';
import { SignatureHeader } from './SignatureHeader';

export interface PayloadHeader {
  channelHeader: ChannelHeader;
  signatureHeader: SignatureHeader;
}
