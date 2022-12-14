export interface KVWriteHash {
  keyHash: string | Uint8Array;
  isDelete: boolean;
  valueHash: string | Uint8Array;
}
