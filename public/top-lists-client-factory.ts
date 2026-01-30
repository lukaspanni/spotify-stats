import { TopListsClient } from './top-lists-client';
import { MockTopListsClient } from './mock-top-lists-client';
import { TopListsClientProxy } from './top-lists-client-proxy';

export class TopListsClientFactory {
  public getTopListsClient(accessToken?: string): TopListsClient {
    if (import.meta.env.DEV) return new MockTopListsClient();
    return new TopListsClientProxy(accessToken);
  }
}
