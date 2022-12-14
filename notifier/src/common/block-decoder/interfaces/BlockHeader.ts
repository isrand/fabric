export interface BlockHeader {
  number: number | undefined;
  previousHash: string | Uint8Array | undefined;
  dataHash: string | Uint8Array | undefined;
}
