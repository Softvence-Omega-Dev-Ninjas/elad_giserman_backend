export function extractLastLine(message: string): string {
  if (!message) return 'Unexpected error occurred.';
  const lines = message
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  return lines[lines.length - 1];
}
