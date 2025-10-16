export class AuthResponseDto {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    companyName: string;
    phoneNumber: string;
    role: string;
  };
}

export class TokenResponseDto {
  access_token: string;
  refresh_token: string;
}

