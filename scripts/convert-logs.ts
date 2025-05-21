#!/usr/bin/env -S node --import ts-blank-space/register
/**
 * @file Reads JSON log from Onfinality and makes it readable by a tool like `hl`
 *
 * You can get logs by clicking *Download Logs* at
 * https://indexing.onfinality.io/orgs/agoric-labs/projects/internal/deployments?slot=staging
 *
 * That will give you a date picker which then GETs like:
 * https://index-api.onfinality.io/v3/subqueries/agoric-labs/internal/logs?stage=true&level=info&et=2025-05-21T00:00:00
 *
 * (Note the `staging=true` query param, which you can change for production logs)
 */
if (process.stdin.isTTY) {
  console.error('Usage: cat input.json | convert-logs.ts > output.clog');
  process.exit(1);
}

interface OnFinalityLog {
  result: Array<{
    level: string;
    message: string;
    timestamp: string;
    kubernetes?: { container_name: string };
    category?: string;
    stack?: string;
    payload?: string;
  }>;
  startTime: string;
  endTime: string;
  searchAfterId: [number];
}

export const convert = async () => {
  const raw: string = await new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk) => (data += chunk));
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });

  const { result } = JSON.parse(raw) as OnFinalityLog;

  const lines = result.map((entry) => {
    const time = new Date(entry.timestamp).toISOString();
    const level = entry.level || 'info';
    const category = entry.category || '';
    const message = (entry.message || '').replace(/\s+/g, ' ').trim();
    const kubernetes = entry.kubernetes?.container_name || '';
    const error = entry.stack || entry.payload || '';

    const toLogfmt = (key: string, value: string) => `${key}=${/[\s"]/g.test(value) ? JSON.stringify(value) : value}`;

    return [
      toLogfmt('time', time),
      toLogfmt('level', level),
      toLogfmt('tag', category),
      toLogfmt('host', kubernetes),
      toLogfmt('msg', message),
      error ? toLogfmt('err', error.replace(/\s+/g, ' ').slice(0, 300) + '...') : '',
    ]
      .filter(Boolean)
      .join(' ');
  });

  process.stdout.write(lines.join('\n') + '\n');
};

convert();
