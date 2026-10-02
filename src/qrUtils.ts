import type { Options } from "qr-code-styling";

/* =====================================================
   Types
===================================================== */

export const QR_TYPES = ["URL", "Text", "Email", "Phone", "Wi-Fi"] as const;
export type QRType = (typeof QR_TYPES)[number];

const ERROR_LEVELS = ["L", "M", "Q", "H"] as const;
export type ErrorLevel = (typeof ERROR_LEVELS)[number];

const WIFI_SECURITIES = ["WPA", "WEP", "nopass"] as const;
export type WifiSecurity = (typeof WIFI_SECURITIES)[number];

const DOT_TYPES = ["square", "rounded", "dots", "classy", "classy-rounded"] as const;
const CORNER_TYPES = ["square", "dot", "extra-rounded"] as const;
const CORNER_DOT_TYPES = ["square", "dot"] as const;

export type Design = {
  foreground: string;
  background: string;
  gradientStart: string;
  gradientEnd: string;
  /** Degrees (converted to radians when rendering). */
  gradientRotation: number;
  dotType: (typeof DOT_TYPES)[number];
  cornerType: (typeof CORNER_TYPES)[number];
  cornerDotType: (typeof CORNER_DOT_TYPES)[number];
};

export type Preset = { name: string; design: Design };

export type TextFieldKey =
  | "url"
  | "text"
  | "email"
  | "subject"
  | "message"
  | "phone"
  | "ssid"
  | "password";

export type Fields = Record<TextFieldKey, string> & { security: WifiSecurity };

export type FieldErrors = Partial<Record<TextFieldKey | "general", string>>;

export type Payload = { data: string; errors: FieldErrors; valid: boolean };

export type RecentQR = {
  id: number;
  key: string;
  type: QRType;
  label: string;
  fields: Fields;
  design: Design;
  themeName: string;
  size: number;
  margin: number;
  errorLevel: ErrorLevel;
};

/* =====================================================
   Constants
===================================================== */

export const SIZE_MIN = 180;
export const SIZE_MAX = 600;
export const SIZE_STEP = 10;
export const DEFAULT_SIZE = 400;
export const MARGIN_MAX = 40;
export const DEFAULT_MARGIN = 12;
export const MAX_RECENTS = 6;

/** Below this contrast ratio (WCAG formula) a QR code often fails to scan. */
const MIN_CONTRAST = 3.5;

/** Conservative byte capacity of a QR code per error-correction level. */
const CAPACITY: Record<ErrorLevel, number> = { L: 2900, M: 2300, Q: 1600, H: 1250 };

export const EMPTY_FIELDS: Fields = {
  url: "",
  text: "",
  email: "",
  subject: "",
  message: "",
  phone: "",
  ssid: "",
  password: "",
  security: "WPA",
};

/* =====================================================
   QR themes
   Every gradient stop was checked to keep at least ~4:1
   contrast against its background so each theme scans.
===================================================== */

const CLASSIC: Design = {
  foreground: "#111827",
  background: "#FFFFFF",
  gradientStart: "#111827",
  gradientEnd: "#111827",
  gradientRotation: 0,
  dotType: "square",
  cornerType: "square",
  cornerDotType: "square",
};

export const DEFAULT_DESIGN: Design = CLASSIC;
export const DEFAULT_THEME_NAME = "Classic";

export const presets: Preset[] = [
  { name: "Classic", design: CLASSIC },
  {
    name: "Ocean",
    design: {
      foreground: "#0E7490",
      background: "#F0FDFF",
      gradientStart: "#0E7490",
      gradientEnd: "#2563EB",
      gradientRotation: 45,
      dotType: "rounded",
      cornerType: "extra-rounded",
      cornerDotType: "dot",
    },
  },
  {
    name: "Sunset",
    design: {
      foreground: "#C2410C",
      background: "#FFF7ED",
      gradientStart: "#C2410C",
      gradientEnd: "#DB2777",
      gradientRotation: 45,
      dotType: "rounded",
      cornerType: "extra-rounded",
      cornerDotType: "dot",
    },
  },
  {
    name: "Neon",
    design: {
      foreground: "#22D3EE",
      background: "#0F172A",
      gradientStart: "#22D3EE",
      gradientEnd: "#A855F7",
      gradientRotation: 45,
      dotType: "dots",
      cornerType: "extra-rounded",
      cornerDotType: "dot",
    },
  },
  {
    name: "Aurora",
    design: {
      foreground: "#34D399",
      background: "#071A17",
      gradientStart: "#34D399",
      gradientEnd: "#8B5CF6",
      gradientRotation: 135,
      dotType: "rounded",
      cornerType: "extra-rounded",
      cornerDotType: "dot",
    },
  },
  {
    name: "Cyberpunk",
    design: {
      foreground: "#F0ABFC",
      background: "#09090B",
      gradientStart: "#F0ABFC",
      gradientEnd: "#06B6D4",
      gradientRotation: 45,
      dotType: "classy",
      cornerType: "square",
      cornerDotType: "square",
    },
  },
  {
    name: "Candy",
    design: {
      foreground: "#DB2777",
      background: "#FFF1F8",
      gradientStart: "#DB2777",
      gradientEnd: "#7C3AED",
      gradientRotation: 45,
      dotType: "dots",
      cornerType: "extra-rounded",
      cornerDotType: "dot",
    },
  },
  {
    name: "Forest",
    design: {
      foreground: "#166534",
      background: "#F0FDF4",
      gradientStart: "#166534",
      gradientEnd: "#4D7C0F",
      gradientRotation: 45,
      dotType: "rounded",
      cornerType: "extra-rounded",
      cornerDotType: "dot",
    },
  },
  {
    name: "Royal",
    design: {
      foreground: "#6D28D9",
      background: "#FFFBEB",
      gradientStart: "#6D28D9",
      gradientEnd: "#B45309",
      gradientRotation: 45,
      dotType: "classy",
      cornerType: "extra-rounded",
      cornerDotType: "dot",
    },
  },
  {
    name: "Midnight",
    design: {
      foreground: "#60A5FA",
      background: "#020617",
      gradientStart: "#60A5FA",
      gradientEnd: "#6366F1",
      gradientRotation: 135,
      dotType: "rounded",
      cornerType: "extra-rounded",
      cornerDotType: "dot",
    },
  },
  {
    name: "Lava",
    design: {
      foreground: "#EF4444",
      background: "#18181B",
      gradientStart: "#EF4444",
      gradientEnd: "#F97316",
      gradientRotation: 45,
      dotType: "classy-rounded",
      cornerType: "extra-rounded",
      cornerDotType: "dot",
    },
  },
  {
    name: "Arctic",
    design: {
      foreground: "#0369A1",
      background: "#F0F9FF",
      gradientStart: "#0369A1",
      gradientEnd: "#4F46E5",
      gradientRotation: 135,
      dotType: "rounded",
      cornerType: "extra-rounded",
      cornerDotType: "dot",
    },
  },
];

/* =====================================================
   qr-code-styling options
===================================================== */

type GradientOption = NonNullable<NonNullable<Options["dotsOptions"]>["gradient"]>;

function gradientFor(design: Design): GradientOption {
  return {
    type: "linear",
    // qr-code-styling expects radians; our themes are written in degrees.
    rotation: (design.gradientRotation * Math.PI) / 180,
    colorStops: [
      { offset: 0, color: design.gradientStart },
      { offset: 1, color: design.gradientEnd },
    ],
  };
}

export type RenderSettings = {
  design: Design;
  size: number;
  margin: number;
  errorLevel: ErrorLevel;
  data: string;
};

export function buildOptions({ design, size, margin, errorLevel, data }: RenderSettings): Options {
  return {
    width: size,
    height: size,
    type: "canvas",
    data,
    margin,
    qrOptions: { errorCorrectionLevel: errorLevel },
    dotsOptions: {
      color: design.foreground,
      type: design.dotType,
      gradient: gradientFor(design),
    },
    cornersSquareOptions: {
      color: design.foreground,
      type: design.cornerType,
      gradient: gradientFor(design),
    },
    cornersDotOptions: {
      color: design.foreground,
      type: design.cornerDotType,
      gradient: gradientFor(design),
    },
    backgroundOptions: { color: design.background },
  };
}

/* =====================================================
   Validation + payload building
===================================================== */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const HOST_PATTERN = /^(localhost|(?:[a-z0-9-]+\.)+[a-z0-9-]{2,}|\d{1,3}(?:\.\d{1,3}){3})$/i;

/** Returns a full http(s) URL (adding https:// when missing) or null if invalid. */
function normalizeUrl(input: string): string | null {
  const value = input.trim();
  if (!value || /\s/.test(value)) return null;

  const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(value) ? value : `https://${value}`;

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    if (parsed.username || parsed.password) return null;
    if (!HOST_PATTERN.test(parsed.hostname)) return null;
    return candidate;
  } catch {
    return null;
  }
}

/** Returns "+15551234567"-style digits for a tel: link, or null if invalid. */
function normalizePhone(input: string): string | null {
  const value = input.trim();
  if (!/^\+?[\d\s().-]+$/.test(value)) return null;
  const digits = value.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return null;
  return `${value.startsWith("+") ? "+" : ""}${digits}`;
}

/** mailto: links need %20 for spaces (URLSearchParams would produce "+"). */
function buildMailto(email: string, subject: string, message: string): string {
  const parts: string[] = [];
  if (subject.trim()) parts.push(`subject=${encodeURIComponent(subject.trim())}`);
  if (message.trim()) {
    parts.push(`body=${encodeURIComponent(message.trim().replace(/\r?\n/g, "\r\n"))}`);
  }
  const address = encodeURIComponent(email).replace(/%40/g, "@");
  return `mailto:${address}${parts.length ? `?${parts.join("&")}` : ""}`;
}

/** Wi-Fi QR format: \ ; , : and " must be escaped with a backslash. */
function escapeWifi(value: string): string {
  return value.replace(/([\\;,:"])/g, "\\$1");
}

const LEVEL_NAMES: Record<ErrorLevel, string> = {
  L: "Low",
  M: "Medium",
  Q: "Quartile",
  H: "High",
};

export function buildPayload(type: QRType, f: Fields, level: ErrorLevel): Payload {
  const errors: FieldErrors = {};
  let data = "";

  switch (type) {
    case "URL": {
      if (!f.url.trim()) {
        errors.url = "Enter the web address you want the QR code to open.";
      } else {
        const url = normalizeUrl(f.url);
        if (url) data = url;
        else errors.url = "That doesn't look like a valid web address. Try something like https://example.com.";
      }
      break;
    }

    case "Text": {
      if (!f.text.trim()) errors.text = "Enter the text you want to encode.";
      else data = f.text.trim();
      break;
    }

    case "Email": {
      const email = f.email.trim();
      if (!email) errors.email = "Enter the recipient's email address.";
      else if (!EMAIL_PATTERN.test(email)) errors.email = "Enter a valid email address, like name@example.com.";
      else data = buildMailto(email, f.subject, f.message);
      break;
    }

    case "Phone": {
      if (!f.phone.trim()) {
        errors.phone = "Enter a phone number.";
      } else {
        const phone = normalizePhone(f.phone);
        if (phone) data = `tel:${phone}`;
        else errors.phone = "Enter 7–15 digits. Spaces, ( ), - and a leading + are allowed.";
      }
      break;
    }

    case "Wi-Fi": {
      if (!f.ssid.trim()) {
        errors.ssid = "Enter the network name (SSID).";
      } else if (new TextEncoder().encode(f.ssid).length > 32) {
        errors.ssid = "That name is too long. Wi-Fi network names are limited to 32 bytes.";
      }

      if (f.security !== "nopass") {
        const pw = f.password;
        if (!pw) {
          errors.password = "Enter the Wi-Fi password, or choose “None” for an open network.";
        } else if (f.security === "WPA" && (pw.length < 8 || pw.length > 63) && !/^[0-9a-f]{64}$/i.test(pw)) {
          errors.password = "WPA passwords must be 8–63 characters.";
        }
      }

      if (!errors.ssid && !errors.password) {
        const password = f.security === "nopass" ? "" : `P:${escapeWifi(f.password)};`;
        data = `WIFI:T:${f.security};S:${escapeWifi(f.ssid)};${password};`;
      }
      break;
    }
  }

  if (data && new TextEncoder().encode(data).length > CAPACITY[level]) {
    errors.general = `That's too much data for a QR code at ${LEVEL_NAMES[level]} error correction. Shorten it or lower the error correction.`;
  }

  const valid = data !== "" && Object.keys(errors).length === 0;
  return { data: valid ? data : "", errors, valid };
}

/* =====================================================
   Scan-safety checks
===================================================== */

function channel(value: number): number {
  const s = value / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return 0;
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export type ScanCheck = { ratio: number; lowContrast: boolean; inverted: boolean };

/** Checks every gradient stop against the background. */
export function checkScanSafety(design: Design): ScanCheck {
  const stops = [design.gradientStart, design.gradientEnd];
  const ratio = Math.min(...stops.map((color) => contrastRatio(color, design.background)));
  const background = luminance(design.background);
  return {
    ratio,
    lowContrast: ratio < MIN_CONTRAST,
    // Light code on a darker background: fine on modern phones, not on every scanner.
    inverted: stops.every((color) => luminance(color) > background),
  };
}

/* =====================================================
   Recent QR codes (localStorage)
===================================================== */

const RECENT_KEY = "qr-studio-recent-v2";

const TYPE_FIELDS: Record<QRType, TextFieldKey[]> = {
  URL: ["url"],
  Text: ["text"],
  Email: ["email", "subject", "message"],
  Phone: ["phone"],
  "Wi-Fi": ["ssid"],
};

/** Keeps only the fields that belong to this QR type. Wi-Fi passwords are never stored. */
function pickFields(type: QRType, fields: Fields): Fields {
  const picked: Fields = { ...EMPTY_FIELDS, security: fields.security };
  for (const key of TYPE_FIELDS[type]) picked[key] = fields[key];
  return picked;
}

type NewRecent = {
  type: QRType;
  fields: Fields;
  data: string;
  design: Design;
  themeName: string;
  size: number;
  margin: number;
  errorLevel: ErrorLevel;
};

export function createRecent(input: NewRecent): RecentQR {
  const { type, fields, data } = input;
  const label =
    type === "Wi-Fi"
      ? fields.ssid
      : type === "Email" && fields.subject.trim()
        ? `${fields.email.trim()} — ${fields.subject.trim()}`
        : data;

  return {
    id: Date.now(),
    key: type === "Wi-Fi" ? `Wi-Fi|${fields.ssid}|${fields.security}` : `${type}|${data}`,
    type,
    label: label.slice(0, 200),
    fields: pickFields(type, fields),
    design: input.design,
    themeName: input.themeName,
    size: input.size,
    margin: input.margin,
    errorLevel: input.errorLevel,
  };
}

/** Newest first, no duplicates, capped at MAX_RECENTS. */
export function addRecent(list: RecentQR[], item: RecentQR): RecentQR[] {
  return [item, ...list.filter((entry) => entry.key !== item.key)].slice(0, MAX_RECENTS);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function oneOf<T extends string>(list: readonly T[], value: unknown, fallback: T): T {
  return typeof value === "string" && (list as readonly string[]).includes(value) ? (value as T) : fallback;
}

function asString(value: unknown, max = 3000): string {
  return typeof value === "string" ? value.slice(0, max) : "";
}

function asColor(value: unknown, fallback: string): string {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

function asNumber(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(max, Math.max(min, Math.round(value)))
    : fallback;
}

/** Validates data read from localStorage so corrupted entries can't crash the app. */
function parseRecent(raw: unknown): RecentQR | null {
  if (!isRecord(raw)) return null;
  const f = raw.fields;
  const d = raw.design;
  const id = raw.id;
  const key = raw.key;
  if (!isRecord(f) || !isRecord(d)) return null;
  if (typeof id !== "number" || typeof key !== "string") return null;

  const type = oneOf(QR_TYPES, raw.type, "URL");
  if (type !== raw.type) return null;

  return {
    id,
    key,
    type,
    label: asString(raw.label, 200),
    fields: {
      url: asString(f.url),
      text: asString(f.text),
      email: asString(f.email, 320),
      subject: asString(f.subject, 500),
      message: asString(f.message),
      phone: asString(f.phone, 40),
      ssid: asString(f.ssid, 64),
      password: "",
      security: oneOf(WIFI_SECURITIES, f.security, "WPA"),
    },
    design: {
      foreground: asColor(d.foreground, CLASSIC.foreground),
      background: asColor(d.background, CLASSIC.background),
      gradientStart: asColor(d.gradientStart, CLASSIC.gradientStart),
      gradientEnd: asColor(d.gradientEnd, CLASSIC.gradientEnd),
      gradientRotation: asNumber(d.gradientRotation, 0, 360, 0),
      dotType: oneOf(DOT_TYPES, d.dotType, "square"),
      cornerType: oneOf(CORNER_TYPES, d.cornerType, "square"),
      cornerDotType: oneOf(CORNER_DOT_TYPES, d.cornerDotType, "square"),
    },
    themeName: asString(raw.themeName, 40),
    size: asNumber(raw.size, SIZE_MIN, SIZE_MAX, DEFAULT_SIZE),
    margin: asNumber(raw.margin, 0, MARGIN_MAX, DEFAULT_MARGIN),
    errorLevel: oneOf(ERROR_LEVELS, raw.errorLevel, "M"),
  };
}

export function loadRecents(): RecentQR[] {
  try {
    const saved = localStorage.getItem(RECENT_KEY);
    if (!saved) return [];

    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map(parseRecent)
      .filter((item): item is RecentQR => item !== null)
      .slice(0, MAX_RECENTS);
  } catch {
    // Corrupted JSON or storage unavailable: start fresh.
    try {
      localStorage.removeItem(RECENT_KEY);
    } catch {
      /* storage unavailable */
    }
    return [];
  }
}

export function saveRecents(items: RecentQR[]): void {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(items));
  } catch {
    /* storage full or unavailable: the app keeps working without persistence */
  }
}
