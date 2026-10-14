import { APIRequestContext, APIResponse } from '@playwright/test';

export interface CustomerAddress {
  street?: string;
  house_number?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
}

export interface RegisterCustomerPayload {
  first_name: string;
  last_name: string;
  dob?: string;
  address?: string | CustomerAddress;
  postcode?: string;
  postal_code?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  email: string;
  password?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

function formatCustomerPayload(data: RegisterCustomerPayload) {
  let addressObj: CustomerAddress;
  if (typeof data.address === 'object' && data.address !== null) {
    addressObj = data.address;
  } else {
    addressObj = {
      street: typeof data.address === 'string' ? data.address : 'Street 1',
      city: data.city || 'City',
      state: data.state || 'State',
      country: data.country || 'Country',
      postal_code: data.postcode || data.postal_code || '12345',
    };
  }

  return {
    first_name: data.first_name,
    last_name: data.last_name,
    dob: data.dob || '1990-01-01',
    address: addressObj,
    phone: data.phone || '1234567890',
    email: data.email,
    password: data.password || 'T00lsh@pSecure2026!',
  };
}

export class AuthHelper {
  constructor(private request: APIRequestContext) {}

  async loginResponse(credentials: LoginCredentials): Promise<APIResponse> {
    return await this.request.post('/users/login', {
      data: credentials,
    });
  }

  async registerCustomerResponse(customerData: RegisterCustomerPayload): Promise<APIResponse> {
    return await this.request.post('/users/register', {
      data: formatCustomerPayload(customerData),
    });
  }
}
