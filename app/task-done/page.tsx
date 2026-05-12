type Props = { searchParams: Promise<{ status?: string }> };

export default async function TaskDonePage({ searchParams }: Props) {
  const { status } = await searchParams;

  const completed = status === 'completed';
  const heading = completed ? 'Task marked as complete' : 'Link invalid or expired';
  const detail = completed ? 'You can close this tab.' : 'This link has expired or is not valid.';

  return (
    <main style={{ fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '12px', padding: '24px' }}>
      <p style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', margin: 0 }}>{heading}</p>
      <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>{detail}</p>
      <a href="/" style={{ marginTop: '8px', fontSize: '13px', color: '#059669', textDecoration: 'none', fontWeight: 500 }}>Back to dashboard</a>
    </main>
  );
}
