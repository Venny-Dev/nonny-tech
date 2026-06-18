import { Request } from "express";

export interface SignupRequest extends Request {
  body: {
    email: string;
    password: string;
    passwordConfirm: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface LoginRequest extends Request {
  body: {
    email: string;
    password: string;
  };
}

export interface ForgotPasswordRequest extends Request {
  body: {
    email: string;
  };
}

export interface ResetPasswordRequest extends Request {
  params: {
    token: string;
  } & any;
  body: {
    password: string;
    passwordConfirm: string;
  };
}

export interface GetMeRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}
