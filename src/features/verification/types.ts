export type UploadTokenClaims = { email: string };

export type RequestOtpInput = { email: string };
export type RequestOtpResult = { success: true };

export type VerifyOtpInput = { email: string; code: string };
export type VerifyOtpResult = { token: string };
