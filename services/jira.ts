import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const JIRA_BASE_URL = process.env.JIRA_BASE_URL?.trim();
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;

if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) {
  throw new Error('Missing JIRA_BASE_URL, JIRA_EMAIL, or JIRA_API_TOKEN in .env');
}

const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');

const client = axios.create({
  baseURL: JIRA_BASE_URL,
  headers: {
    Authorization: `Basic ${auth}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ---------- helpers ----------

interface JiraField {
  summary: string;
  description: any;
  labels: string[];
  status: { name: string };
}

interface JiraIssue {
  key: string;
  fields: JiraField;
}

function adfToPlainText(node: any): string {
  if (!node) return '';
  if (typeof node === 'string') return node;

  const parts: string[] = [];

  if (node.type === 'text') {
    return node.text ?? '';
  }

  if (node.content && Array.isArray(node.content)) {
    for (const child of node.content) {
      parts.push(adfToPlainText(child));
    }
  }

  if (node.type === 'paragraph' || node.type === 'heading' || node.type === 'listItem') {
    return parts.join('') + '\n';
  }

  return parts.join('');
}

// ---------- exported functions ----------

export async function gettodotasks(projectKey: string): Promise<JiraIssue[]> {
  console.log(`[Jira] gettodotasks → project=${projectKey}`);

  const jql = `project = ${projectKey} AND status = "To Do" ORDER BY created DESC`;

  const { data } = await client.get('/rest/api/3/search', {
    params: {
      jql,
      fields: 'summary,description,labels,status',
    },
  });

  console.log(`[Jira] gettodotasks → found ${data.issues?.length ?? 0} issues`);
  return data.issues ?? [];
}

export async function gettaskdescription(issueKey: string): Promise<string> {
  console.log(`[Jira] gettaskdescription → issue=${issueKey}`);

  const { data } = await client.get(`/rest/api/3/issue/${issueKey}`, {
    params: { fields: 'description' },
  });

  const raw = data.fields?.description;
  const text = adfToPlainText(raw).trim();

  console.log(`[Jira] gettaskdescription → length=${text.length}`);
  return text;
}

export async function movetask(issueKey: string, transitionName: string): Promise<void> {
  console.log(`[Jira] movetask → issue=${issueKey}, transition="${transitionName}"`);

  const { data } = await client.get(`/rest/api/3/issue/${issueKey}/transitions`);

  const transition = data.transitions?.find(
    (t: any) => t.name.toLowerCase() === transitionName.toLowerCase(),
  );

  if (!transition) {
    const available = data.transitions?.map((t: any) => t.name).join(', ') ?? '(none)';
    throw new Error(
      `Transition "${transitionName}" not found for ${issueKey}. Available: ${available}`,
    );
  }

  await client.post(`/rest/api/3/issue/${issueKey}/transitions`, {
    transition: { id: transition.id },
  });

  console.log(`[Jira] movetask → moved to "${transition.name}"`);
}

export async function updatedescription(issueKey: string, appendText: string): Promise<void> {
  console.log(`[Jira] updatedescription → issue=${issueKey}, append=${appendText.length} chars`);

  const { data } = await client.get(`/rest/api/3/issue/${issueKey}`, {
    params: { fields: 'description' },
  });

  const existing: any = data.fields?.description;

  // Build the new paragraph to append
  const newParagraph = {
    type: 'paragraph',
    content: [
      {
        type: 'text',
        text: appendText,
      },
    ],
  };

  let newDescription: any;

  if (existing && existing.content && existing.content.length > 0) {
    // Merge: keep existing root doc, append new paragraph
    newDescription = {
      ...existing,
      content: [...existing.content, newParagraph],
    };
  } else {
    // No existing description — create fresh ADF doc
    newDescription = {
      version: 1,
      type: 'doc',
      content: [newParagraph],
    };
  }

  await client.put(`/rest/api/3/issue/${issueKey}`, {
    fields: {
      description: newDescription,
    },
  });

  console.log(`[Jira] updatedescription → appended successfully`);
}
