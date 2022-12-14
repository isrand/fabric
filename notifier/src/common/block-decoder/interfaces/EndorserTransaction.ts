import { TransactionAction } from './TransactionAction';

export interface EndorserTransaction {
  actions: TransactionAction[];
}
