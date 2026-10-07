type Labels = Record<string, string>;

const counters = new Map<string, { value: number; labels: Labels }>();
const durations = new Map<string, { value: number; labels: Labels; count: number }>();

function metricKey(name: string, labels: Labels): string {
  return `${name}|${Object.entries(labels).sort(([a], [b]) => a.localeCompare(b)).map(([label, value]) => `${label}=${value}`).join(",")}`;
}

export function incrementMetric(name: string, labels: Labels = {}, value = 1): void {
  const key = metricKey(name, labels);
  const current = counters.get(key);
  counters.set(key, { value: (current?.value ?? 0) + value, labels });
}

export function observeDuration(name: string, durationMs: number, labels: Labels = {}): void {
  const key = metricKey(name, labels);
  const current = durations.get(key);
  durations.set(key, { value: (current?.value ?? 0) + durationMs, count: (current?.count ?? 0) + 1, labels });
}

function escapeLabel(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll("\"", "\\\"").replaceAll("\n", "\\n");
}

function formatLabels(labels: Labels): string {
  const entries = Object.entries(labels);
  return entries.length ? `{${entries.map(([name, value]) => `${name}="${escapeLabel(value)}"`).join(",")}}` : "";
}

export function renderMetrics(): string {
  const lines: string[] = [
    "# TYPE rolescout_http_requests_total counter",
    "# TYPE rolescout_http_errors_total counter",
    "# TYPE rolescout_http_request_duration_seconds summary",
  ];
  for (const [key, counter] of counters) {
    const [name] = key.split("|");
    lines.push(`${name}${formatLabels(counter.labels)} ${counter.value}`);
  }
  for (const [key, duration] of durations) {
    const [name] = key.split("|");
    lines.push(`${name}_count${formatLabels(duration.labels)} ${duration.count}`);
    lines.push(`${name}_sum${formatLabels(duration.labels)} ${duration.value / 1000}`);
  }
  return `${lines.join("\n")}\n`;
}

export function resetMetrics(): void {
  counters.clear();
  durations.clear();
}
