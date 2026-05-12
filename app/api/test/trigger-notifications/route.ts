import { NextResponse } from 'next/server';
import { env } from '@/lib/env';

export async function POST(request: Request) {
  const base = new URL(request.url).origin;
  const headers = { Authorization: `Bearer ${env.CRON_SECRET}` };

  const [emailRes, smsRes] = await Promise.all([
    fetch(`${base}/api/notifications/email-summary/run`, { method: 'GET', headers }),
    fetch(`${base}/api/notifications/sms-fibonacci/run`, { method: 'GET', headers }),
  ]);

  return NextResponse.json({
    email: await emailRes.json(),
    sms: await smsRes.json(),
  });
}
