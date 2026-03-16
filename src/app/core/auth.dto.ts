export interface AuthResultDto {
  success: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: string | null;
  errors: string[] | null;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  fullName: string;
  password: string;
}

export interface RefreshTokenRequestDto {
  refreshToken: string;
}

export interface MeDto {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

