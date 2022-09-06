import { User } from './spotify-types';

export interface UserClient {
  getCurrentUser(): Promise<User>;
}
