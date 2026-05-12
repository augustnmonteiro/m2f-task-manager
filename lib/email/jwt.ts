import { SignJWT, jwtVerify } from 'jose';

function getSecret(): Uint8Array {
  const secret = process.env.EMAIL_JWT_SECRET;
  if (!secret) throw new Error('EMAIL_JWT_SECRET is not set');
  return new TextEncoder().encode(secret);
}

export async function signTaskJwt(userId: string, taskId: string): Promise<string> {
  return new SignJWT({ userId, taskId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(getSecret());
}

export async function verifyTaskJwt(token: string): Promise<{ userId: string; taskId: string }> {
  const { payload } = await jwtVerify(token, getSecret());
  const userId = payload['userId'];
  const taskId = payload['taskId'];
  if (typeof userId !== 'string' || typeof taskId !== 'string') {
    throw new Error('Invalid JWT payload');
  }
  return { userId, taskId };
}
