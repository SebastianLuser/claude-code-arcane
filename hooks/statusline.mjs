// Model and context usage for statusline.sh, from the session JSON Claude Code sends on stdin.
// Prints `MODEL=<name>` and `EXTRA=<context part>`; the shell script builds the bar.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function fmt(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return `${Math.round(n / 1000)}k`;
  return String(n);
}

const tokens = (u) =>
  (u.input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0);

/** Git Bash hands over /c/Users/...; Windows file APIs need C:/Users/.... */
export function nativePath(p, platform = process.platform) {
  return platform === "win32" && /^\/[a-zA-Z]\//.test(p) ? `${p[1].toUpperCase()}:${p.slice(2)}` : p;
}

function lastUsage(transcript) {
  let last = null;
  for (const line of fs.readFileSync(transcript, "utf-8").split("\n")) {
    try {
      const m = JSON.parse(line);
      if (m.type === "assistant" && m.message?.usage) last = m.message.usage;
    } catch {}
  }
  return last;
}

export function render(data, platform = process.platform) {
  const model = data.model ?? {};
  const modelId = model.id ?? "";
  let total = null;
  let limit = null;
  let pct = null;

  // Claude Code gives the real window for this session and model; never hardcode it.
  const cw = data.context_window;
  if (cw && typeof cw === "object" && Object.keys(cw).length) {
    limit = cw.context_window_size || null;
    if (cw.current_usage && Object.keys(cw.current_usage).length) total = tokens(cw.current_usage);
    const up = Number(cw.used_percentage);
    if (cw.used_percentage != null && !Number.isNaN(up)) pct = up;
    // Hooks never see the window size; session-watch.mjs reads it from here to warn
    // before a compaction at a share of the real window instead of a guessed one.
    const project = data.workspace?.project_dir || data.cwd || "";
    if (pct !== null && project && fs.existsSync(path.join(project, ".claude"))) {
      try {
        const state = path.join(project, ".claude", "session-state");
        fs.mkdirSync(state, { recursive: true });
        const ignore = path.join(state, ".gitignore");
        if (!fs.existsSync(ignore)) fs.writeFileSync(ignore, "*\n");
        fs.writeFileSync(
          path.join(state, "context.json"),
          JSON.stringify({ session_id: data.session_id ?? null, used_percentage: pct, context_window_size: limit }),
        );
      } catch {}
    }
  }

  // Fallback for an older Claude Code without context_window: the transcript's last usage.
  if (total === null) {
    const transcript = nativePath(data.transcript_path || "", platform);
    let usage = null;
    try {
      if (transcript && fs.existsSync(transcript)) usage = lastUsage(transcript);
    } catch {}
    if (usage) {
      total = tokens(usage);
      // Last resort only: infer the window from a 1M marker, else assume 200k.
      limit ??= modelId.includes("[1m]") || modelId.endsWith("-1m") ? 1000000 : 200000;
    }
  }

  let extra = "";
  if (total !== null && limit) {
    pct ??= (total * 100) / limit;
    extra = `\u{1F9E0} ${fmt(total)} / ${fmt(limit)} (${Math.round(pct)}%)`;
  }
  return { model: model.display_name || modelId || "", extra };
}

if (process.argv[1] && path.basename(process.argv[1]) === path.basename(fileURLToPath(import.meta.url))) {
  try {
    const { model, extra } = render(JSON.parse(fs.readFileSync(0, "utf-8")));
    process.stdout.write(`MODEL=${model}\nEXTRA=${extra}\n`);
  } catch {}
}
