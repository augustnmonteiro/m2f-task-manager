export type TaskEmailInput = {
  type: 'task';
  title: string;
  createdAt: string;
};

export type DigestEmailInput = {
  type: 'digest';
  tasks: Array<{ title: string }>;
};

export type EmailInput = TaskEmailInput | DigestEmailInput;

const CARD = 'font-family:sans-serif;max-width:480px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;';
const HEADER = 'background:#059669;padding:12px 20px;';
const HEADER_LABEL = 'color:white;font-size:14px;font-weight:600;';
const BODY = 'padding:20px;';
const TITLE = 'margin:0 0 4px;font-size:18px;font-weight:700;color:#1e293b;';
const META = 'margin:0;font-size:12px;color:#94a3b8;';
const LIST = 'margin:0;padding:0;list-style:none;';
const LIST_ITEM = 'padding:12px 20px;border-top:1px solid #f1f5f9;';
const ITEM_TITLE = 'margin:0;font-weight:600;color:#1e293b;font-size:14px;';
const EMPTY = 'margin:0;color:#94a3b8;font-size:14px;';

function card(label: string, body: string): string {
  return (
    `<div style="${CARD}">` +
      `<div style="${HEADER}"><span style="${HEADER_LABEL}">${label}</span></div>` +
      body +
    `</div>`
  );
}

export function buildEmailHtml(input: EmailInput): string {
  if (input.type === 'task') {
    return card(
      'New Task Added',
      `<div style="${BODY}">` +
        `<p style="${TITLE}">${input.title}</p>` +
        `<p style="${META}">Created ${input.createdAt}</p>` +
      `</div>`,
    );
  }

  if (input.tasks.length === 0) {
    return card(
      'Pending Tasks Summary',
      `<div style="${BODY}"><p style="${EMPTY}">No pending tasks.</p></div>`,
    );
  }

  const items = input.tasks
    .map(t => `<li style="${LIST_ITEM}"><p style="${ITEM_TITLE}">${t.title}</p></li>`)
    .join('');

  return card('Pending Tasks Summary', `<ul style="${LIST}">${items}</ul>`);
}
