import { Observable } from 'rxjs';

export interface ICreateWalletRequest {
  user_id: string;
}

export interface IGetWalletRequest {
  id: string;
}

export interface ICreditWalletRequest {
  wallet_id: string;
  amount: number;
}

export interface IDebitWalletRequest {
  wallet_id: string;
  amount: number;
}

export interface IWalletResponse {
  id: string;
  user_id: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface IWalletServiceGrpc {
  createWallet(data: ICreateWalletRequest): Observable<IWalletResponse>;
  getWallet(data: IGetWalletRequest): Observable<IWalletResponse>;
  creditWallet(data: ICreditWalletRequest): Observable<IWalletResponse>;
  debitWallet(data: IDebitWalletRequest): Observable<IWalletResponse>;
}
