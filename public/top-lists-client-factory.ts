import { TopListsClient } from './top-lists-client';
import { TopListsClientProxy } from './top-lists-client-proxy';

export class TopListsClientFactory {
  public getTopListsClient(accessToken?: string): TopListsClient {
    return new TopListsClientProxy(accessToken);
  }
}
