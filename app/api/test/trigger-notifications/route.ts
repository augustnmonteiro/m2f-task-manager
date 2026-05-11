import { NextResponse } from 'next/server';
import { env } from '@/lib/env';

export async function POST(request: Request) {
  if (env.E2E_TEST_MODE !== 'true') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }

  const base = new URL(request.url).origin;
  const headers = { Authorization: `Bearer ${env.CRON_SECRET}` };

  const [emailRes, smsRes] = await Promise.all([
    fetch(`${base}/api/notifications/email-summary/run`, { method: 'POST', headers }),
    fetch(`${base}/api/notifications/sms-fibonacci/run`, { method: 'POST', headers }),
  ]);

  return NextResponse.json({
    email: await emailRes.json(),
    sms: await smsRes.json(),
  });
}
