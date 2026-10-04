const MAX_CSP_REPORT_BYTES = 32 * 1024;

function safeLocation(value, originOnly = false) {
  if (typeof value !== 'string') return undefined;
  if (['inline', 'eval', 'self', 'data', 'blob'].includes(value)) return value;
  try {
    const location = new URL(value);
    if (!['http:', 'https:', 'ws:', 'wss:'].includes(location.protocol)) return location.protocol;
    return originOnly ? location.origin : location.pathname.slice(0, 256);
  } catch {
    return undefined;
  }
}

function normalizeCspReports(value) {
  const entries = Array.isArray(value) ? value : [value];
  return entries.slice(0, 20).flatMap((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return [];
    const report = entry['csp-report'] ?? (entry.type === 'csp-violation' ? entry.body : undefined);
    if (!report || typeof report !== 'object' || Array.isArray(report)) return [];
    const directive = report['effective-directive'] ?? report.effectiveDirective;
    if (typeof directive !== 'string' || !/^[a-z-]{1,64}$/.test(directive)) return [];
    const status = report['status-code'] ?? report.statusCode;
    return [
      {
        directive,
        disposition: report.disposition === 'report' ? 'report' : 'enforce',
        documentPath: safeLocation(report['document-uri'] ?? report.documentURL),
        blockedOrigin: safeLocation(report['blocked-uri'] ?? report.blockedURL, true),
        status: Number.isInteger(status) ? status : undefined,
      },
    ];
  });
}

module.exports = { MAX_CSP_REPORT_BYTES, normalizeCspReports };
