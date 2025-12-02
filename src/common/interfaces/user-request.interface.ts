export interface UserPayload {
  id: string;
  email: string;
  roles: string[];
}

export interface RequestWithUser extends Request {
  user: UserPayload;
}

