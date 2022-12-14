export interface KVWrite {
  key: string;
  isDelete: boolean;
  value: string | Uint8Array;
}
