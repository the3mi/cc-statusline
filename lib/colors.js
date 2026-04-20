// ─── Theme system & ANSI color helpers ─────────────────────────────────

export const R = '\x1b[0m';
export const DIM = '\x1b[2m';
export const BOLD = '\x1b[1m';
export const UND = '\x1b[4m';

// Color slots:
//   m   model name           c   cost / primary highlight
//   d   dim/secondary text   b   branch / dir / soft accent
//   i   info / medium warn   ok  success / low usage
//   err hard error           hi  high usage / dirty (warning, not alarm)
//   ed  edited / accent      bar token bar / secondary stat
const THEMES = {
  default:    { m: '\x1b[36m',         c: '\x1b[32m',         d: '\x1b[2m',          b: '\x1b[34m',         i: '\x1b[33m',         ok: '\x1b[32m',        err: '\x1b[31m',        ed: '\x1b[35m',        bar: '\x1b[36m',        hi: '\x1b[33m'         },
  nord:       { m: '\x1b[38;5;110m',  c: '\x1b[38;5;151m',  d: '\x1b[38;5;244m',   b: '\x1b[38;5;109m',  i: '\x1b[38;5;222m',  ok: '\x1b[38;5;151m', err: '\x1b[38;5;174m', ed: '\x1b[38;5;139m', bar: '\x1b[38;5;110m', hi: '\x1b[38;5;216m'  },
  // Catppuccin Mocha — softened: mauve instead of hot pink, sage green, peach for warn, maroon for err.
  catppuccin: { m: '\x1b[38;5;183m',  c: '\x1b[38;5;151m',  d: '\x1b[38;5;245m',   b: '\x1b[38;5;147m',  i: '\x1b[38;5;222m',  ok: '\x1b[38;5;151m', err: '\x1b[38;5;174m', ed: '\x1b[38;5;218m', bar: '\x1b[38;5;117m', hi: '\x1b[38;5;216m'  },
  dracula:    { m: '\x1b[38;5;141m',  c: '\x1b[38;5;120m',  d: '\x1b[38;5;244m',   b: '\x1b[38;5;229m',  i: '\x1b[38;5;222m',  ok: '\x1b[38;5;120m', err: '\x1b[38;5;174m', ed: '\x1b[38;5;218m', bar: '\x1b[38;5;117m', hi: '\x1b[38;5;216m'  },
  // Ultra-soft pastel — gentle on eyes, no saturated colors anywhere.
  pastel:     { m: '\x1b[38;5;182m',  c: '\x1b[38;5;151m',  d: '\x1b[38;5;245m',   b: '\x1b[38;5;152m',  i: '\x1b[38;5;223m',  ok: '\x1b[38;5;151m', err: '\x1b[38;5;181m', ed: '\x1b[38;5;217m', bar: '\x1b[38;5;152m', hi: '\x1b[38;5;217m'  },
};

export function getTheme(name) {
  return THEMES[name] || THEMES.default;
}

export const POWERLINE = '\uE0B0';
export const POWERLINE_REV = '\uE0B2';

export const seg = (content, fg) => fg + content + R;
export const segDim = (content) => DIM + content + R;
export const segBold = (content, fg) => BOLD + fg + content + R;
