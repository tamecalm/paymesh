import { Observable } from 'rxjs';

export interface ICreateWalletRequest {
  userId: string;
}

export interface IGetWalletRequest {
  id: string;
}

export interface ICreditWalletRequest {
  walletId: string;
  amount: number;
}

export interface IDebitWalletRequest {
  walletId: string;
  amount: number;
}

export interface IWalletResponse {
  id: string;
  userId: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export interface IWalletServiceGrpc {
  createWallet(data: ICreateWalletRequest): Observable<IWalletResponse>;
  getWallet(data: IGetWalletRequest): Observable<IWalletResponse>;
  creditWallet(data: ICreditWalletRequest): Observable<IWalletResponse>;
  debitWallet(data: IDebitWalletRequest): Observable<IWalletResponse>;
}
