/* eslint-disable @typescript-eslint/no-explicit-any */
declare module "jito-js-rpc" {
  import { AxiosInstance } from "axios";

  interface JsonRpcRequest {
    jsonrpc: string;
    id: number;
    method: string;
    params: any[];
  }

  interface BundleStatus {
    status: string;
    landed_slot?: number;
  }

  class JitoJsonRpcClient {
    constructor(baseUrl: string, uuid?: string);

    client: AxiosInstance;

    sendRequest(endpoint: string, method: string, params?: any[]): Promise<any>;
    getTipAccounts(): Promise<{ result: any[] }>;
    getRandomTipAccount(): Promise<any>;
    sendBundle(params: any[]): Promise<any>;
    sendTxn(params: any, bundleOnly?: boolean): Promise<any>;
    getInFlightBundleStatuses(
      params: any[]
    ): Promise<{ result: { value: BundleStatus[] } }>;
    getBundleStatuses(
      params: any[]
    ): Promise<{ result: { value: BundleStatus[] } }>;
    confirmInflightBundle(
      bundleId: string,
      timeoutMs?: number
    ): Promise<BundleStatus>;
  }

  export { JitoJsonRpcClient };
}
