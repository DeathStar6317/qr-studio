import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, CSSProperties, KeyboardEvent } from "react";

import QRCodeStyling from "qr-code-styling";

import "./App.css";
import {
  DEFAULT_DESIGN,
  DEFAULT_MARGIN,
  DEFAULT_SIZE,
  DEFAULT_THEME_NAME,
  EMPTY_FIELDS,
  MARGIN_MAX,
  QR_TYPES,
  SIZE_MAX,
  SIZE_MIN,
  SIZE_STEP,
  addRecent,
  buildOptions,
  buildPayload,
  checkScanSafety,
  createRecent,
  loadRecents,
  presets,
  saveRecents,
} from "./qrUtils";
import type {
  Design,
  ErrorLevel,
  Fields,
  Preset,
  QRType,
  RecentQR,
  TextFieldKey,
  WifiSecurity,
} from "./qrUtils";

/* =====================================================
   Constants
===================================================== */

type AppTheme = "light" | "dark";

const THEME_KEY = "qr-studio-theme";
const PREVIEW_DATA = "https://example.com/qr-studio";

const LEVEL_LABELS: Record<ErrorLevel, string> = {
  L: "Low",
  M: "Medium",
  Q: "Quartile",
  H: "High",
};

type SelectOption<T extends string> = {
  value: T;
  label: string;
  description?: string;
};

const LEVEL_OPTIONS: SelectOption<ErrorLevel>[] = [
  { value: "L", label: "Low", description: "Recovers ~7% · simplest code" },
  { value: "M", label: "Medium", description: "Recovers ~15% · recommended" },
  { value: "Q", label: "Quartile", description: "Recovers ~25%" },
  { value: "H", label: "High", description: "Recovers ~30% · best for rough surfaces" },
];

const SECURITY_OPTIONS: SelectOption<WifiSecurity>[] = [
  { value: "WPA", label: "WPA / WPA2 / WPA3" },
  { value: "WEP", label: "WEP" },
  { value: "nopass", label: "None (open network)" },
];

const EMPTY_HINTS: Record<QRType, string> = {
  URL: "Enter a web address to generate your code.",
  Text: "Type some text to generate your code.",
  Email: "Enter an email address to generate your code.",
  Phone: "Enter a phone number to generate your code.",
  "Wi-Fi": "Enter your network details to generate your code.",
};

/* =====================================================
   App theme (light / dark) helpers
===================================================== */

function readSavedTheme(): AppTheme | null {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    return saved === "light" || saved === "dark" ? saved : null;
  } catch {
    return null;
  }
}

function getInitialTheme(): AppTheme {
  return (
    readSavedTheme() ??
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
  );
}

/* =====================================================
   Small presentational pieces
===================================================== */

const iconProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

function QRIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h3v3M21 14v.01M14 21h.01M17 21h4v-4" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg {...iconProps}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg {...iconProps}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg {...iconProps}>
      <path d="m5 12 5 5L20 7" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg {...iconProps}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg {...iconProps}>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;

  return (
    <p className="field-error" id={id} role="alert">
      {message}
    </p>
  );
}

/** Slider fill percentage, read by the .range CSS. */
function rangeStyle(value: number, min: number, max: number): CSSProperties {
  const percent = ((value - min) / (max - min)) * 100;
  return { "--fill": `${percent}%` } as CSSProperties;
}

/* =====================================================
   Custom select (replaces the browser-default <select>)
===================================================== */

type SelectProps<T extends string> = {
  id: string;
  label: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  block?: boolean;
};

function Select<T extends string>({ id, label, value, options, onChange, block }: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const listId = `${id}-list`;
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const selected = options[selectedIndex];

  // Close when clicking outside.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const openList = () => {
    setActive(selectedIndex);
    setOpen(true);
  };

  const choose = (index: number) => {
    const option = options[index];
    if (option) onChange(option.value);
    setOpen(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (!open) openList();
        else setActive((index) => Math.min(index + 1, options.length - 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        if (!open) openList();
        else setActive((index) => Math.max(index - 1, 0));
        break;
      case "Home":
        if (open) {
          event.preventDefault();
          setActive(0);
        }
        break;
      case "End":
        if (open) {
          event.preventDefault();
          setActive(options.length - 1);
        }
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (open) choose(active);
        else openList();
        break;
      case "Escape":
        if (open) {
          event.preventDefault();
          setOpen(false);
        }
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  };

  return (
    <div className={`select${block ? " select--block" : ""}`} ref={rootRef}>
      <button
        type="button"
        id={id}
        className="select-trigger"
        role="combobox"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open ? `${id}-option-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        onKeyUp={(event) => {
          // Stops a second "click" from firing after Space selects an option.
          if (event.key === " ") event.preventDefault();
        }}
      >
        <span>{selected.label}</span>
        <ChevronIcon />
      </button>

      {open && (
        <ul className="select-list" id={listId} role="listbox" aria-label={label}>
          {options.map((option, index) => (
            <li
              key={option.value}
              id={`${id}-option-${index}`}
              role="option"
              aria-selected={option.value === value}
              className={`select-option${index === active ? " is-active" : ""}${
                option.value === value ? " is-selected" : ""
              }`}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => choose(index)}
              onMouseEnter={() => setActive(index)}
            >
              <span className="select-option-text">
                <span className="select-option-label">{option.label}</span>
                {option.description && (
                  <span className="select-option-desc">{option.description}</span>
                )}
              </span>
              {option.value === value && <CheckIcon />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* =====================================================
   Theme card preview: a real miniature QR in that theme
===================================================== */

const ThemePreview = memo(function ThemePreview({ preset }: { preset: Preset }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const qr = new QRCodeStyling(
      buildOptions({
        design: preset.design,
        size: 120,
        margin: 8,
        errorLevel: "M",
        data: PREVIEW_DATA,
      }),
    );
    qr.append(container);

    return () => container.replaceChildren();
  }, [preset]);

  return <div className="theme-preview" ref={ref} style={{ background: preset.design.background }} />;
});

/* =====================================================
   App
===================================================== */

function App() {
  const qrRef = useRef<HTMLDivElement>(null);
  const qrCodeRef = useRef<QRCodeStyling | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  const [appTheme, setAppTheme] = useState<AppTheme>(getInitialTheme);

  const [qrType, setQrType] = useState<QRType>("URL");
  const [fields, setFields] = useState<Fields>(EMPTY_FIELDS);
  const [touched, setTouched] = useState<Partial<Record<TextFieldKey, boolean>>>({});
  const [attempted, setAttempted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [design, setDesign] = useState<Design>(DEFAULT_DESIGN);
  const [themeName, setThemeName] = useState(DEFAULT_THEME_NAME);
  const [size, setSize] = useState(DEFAULT_SIZE);
  const [margin, setMargin] = useState(DEFAULT_MARGIN);
  const [errorLevel, setErrorLevel] = useState<ErrorLevel>("M");

  const [debouncedData, setDebouncedData] = useState("");
  const [recents, setRecents] = useState<RecentQR[]>(loadRecents);
  const [toast, setToast] = useState("");

  /* ---------------------------
     Derived values
  ---------------------------- */

  const payload = useMemo(
    () => buildPayload(qrType, fields, errorLevel),
    [qrType, fields, errorLevel],
  );

  const scanCheck = useMemo(() => checkScanSafety(design), [design]);

  const showQR = payload.valid && debouncedData !== "";
  const isUpdating = payload.valid && debouncedData !== payload.data;

  // Errors appear after the user leaves a field, or after a download attempt,
  // never on first load.
  const fieldError = (key: TextFieldKey): string | undefined =>
    touched[key] || attempted ? payload.errors[key] : undefined;

  /* ---------------------------
     App theme: apply + follow system until the user chooses
  ---------------------------- */

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = appTheme;
  }, [appTheme]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const onChange = (event: MediaQueryListEvent) => {
      if (readSavedTheme() === null) setAppTheme(event.matches ? "dark" : "light");
    };

    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const toggleTheme = () => {
    const next: AppTheme = appTheme === "dark" ? "light" : "dark";
    setAppTheme(next);

    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* storage unavailable: the choice just won't persist */
    }
  };

  /* ---------------------------
     QR preview: create once, then update
  ---------------------------- */

  useEffect(() => {
    const container = qrRef.current;
    if (!container) return;

    const qr = new QRCodeStyling(
      buildOptions({
        design: DEFAULT_DESIGN,
        size: DEFAULT_SIZE,
        margin: DEFAULT_MARGIN,
        errorLevel: "M",
        data: "",
      }),
    );
    qr.append(container);
    qrCodeRef.current = qr;

    return () => {
      container.replaceChildren();
      qrCodeRef.current = null;
    };
  }, []);

  // Only the QR *data* is debounced, so typing doesn't redraw on every keystroke.
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedData(payload.data), 400);
    return () => window.clearTimeout(timer);
  }, [payload.data]);

  // Design, size, margin and error correction update immediately.
  useEffect(() => {
    const qr = qrCodeRef.current;
    if (!qr || !payload.valid || !debouncedData) return;

    try {
      qr.update(buildOptions({ design, size, margin, errorLevel, data: debouncedData }));
    } catch (error) {
      console.error("Could not render the QR code", error);
    }
  }, [debouncedData, payload.valid, design, size, margin, errorLevel]);

  /* ---------------------------
     Toast
  ---------------------------- */

  const showToast = (message: string) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 2800);
  };

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  /* ---------------------------
     Editing
  ---------------------------- */

  const setField = (key: TextFieldKey, value: string) => {
    setFields((current) => ({ ...current, [key]: value }));
  };

  const inputProps = (key: TextFieldKey) => ({
    id: `field-${key}`,
    value: fields[key],
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setField(key, event.target.value),
    onBlur: () => setTouched((current) => ({ ...current, [key]: true })),
    "aria-invalid": fieldError(key) ? true : undefined,
    "aria-describedby": fieldError(key) ? `field-${key}-error` : undefined,
  });

  const switchType = (type: QRType) => {
    setQrType(type);
    setTouched({});
    setAttempted(false);
  };

  const applyPreset = (preset: Preset) => {
    setDesign(preset.design);
    setThemeName(preset.name);
  };

  // Manual colors replace the theme's gradient with a solid color.
  const changeForeground = (color: string) => {
    setDesign((current) => ({
      ...current,
      foreground: color,
      gradientStart: color,
      gradientEnd: color,
    }));
    setThemeName("");
  };

  const changeBackground = (color: string) => {
    setDesign((current) => ({ ...current, background: color }));
    setThemeName("");
  };

  const resetAll = () => {
    setFields(EMPTY_FIELDS);
    setTouched({});
    setAttempted(false);
    setShowPassword(false);
    setDesign(DEFAULT_DESIGN);
    setThemeName(DEFAULT_THEME_NAME);
    setSize(DEFAULT_SIZE);
    setMargin(DEFAULT_MARGIN);
    setErrorLevel("M");
  };

  /* ---------------------------
     Downloads + recents
  ---------------------------- */

  const handleDownload = async (extension: "png" | "svg") => {
    if (!payload.valid) {
      setAttempted(true);

      const firstKey = Object.keys(payload.errors)[0];
      if (firstKey && firstKey !== "general") {
        document.getElementById(`field-${firstKey}`)?.focus();
      }

      showToast(payload.errors.general ?? "Complete the highlighted field first.");
      return;
    }

    const qr = qrCodeRef.current;
    if (!qr) return;

    try {
      await qr.download({
        name: `qr-studio-${qrType.toLowerCase().replace(/[^a-z]/g, "")}`,
        extension,
      });

      const next = addRecent(
        recents,
        createRecent({
          type: qrType,
          fields,
          data: payload.data,
          design,
          themeName,
          size,
          margin,
          errorLevel,
        }),
      );
      setRecents(next);
      saveRecents(next);

      showToast(`${extension.toUpperCase()} downloaded`);
    } catch (error) {
      console.error("Download failed", error);
      showToast("Download failed. Please try again.");
    }
  };

  const loadRecent = (item: RecentQR) => {
    setQrType(item.type);
    setFields(item.fields);
    setDesign(item.design);
    setThemeName(item.themeName);
    setSize(item.size);
    setMargin(item.margin);
    setErrorLevel(item.errorLevel);
    setTouched({});
    setAttempted(false);

    if (item.type === "Wi-Fi" && item.fields.security !== "nopass") {
      showToast("Enter the Wi-Fi password again. Passwords aren't saved.");
    }
  };

  const removeRecent = (id: number) => {
    const next = recents.filter((item) => item.id !== id);
    setRecents(next);
    saveRecents(next);
  };

  const clearRecents = () => {
    setRecents([]);
    saveRecents([]);
  };

  /* ---------------------------
     Inputs for each QR type
  ---------------------------- */

  const renderInputs = () => {
    switch (qrType) {
      case "URL":
        return (
          <div className="field">
            <label className="field-label" htmlFor="field-url">
              Website URL
            </label>
            <input
              {...inputProps("url")}
              className="input"
              type="url"
              inputMode="url"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              placeholder="https://example.com"
            />
            {fieldError("url") ? (
              <FieldError id="field-url-error" message={fieldError("url")} />
            ) : (
              <p className="field-hint">We'll add https:// if you leave it out.</p>
            )}
          </div>
        );

      case "Text":
        return (
          <div className="field">
            <label className="field-label" htmlFor="field-text">
              Text
            </label>
            <textarea
              {...inputProps("text")}
              className="input textarea"
              rows={3}
              placeholder="Enter your text…"
            />
            <FieldError id="field-text-error" message={fieldError("text")} />
          </div>
        );

      case "Email":
        return (
          <>
            <div className="field">
              <label className="field-label" htmlFor="field-email">
                Email address
              </label>
              <input
                {...inputProps("email")}
                className="input"
                type="email"
                autoCapitalize="off"
                spellCheck={false}
                placeholder="name@example.com"
              />
              <FieldError id="field-email-error" message={fieldError("email")} />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="field-subject">
                Subject <span className="field-optional">(optional)</span>
              </label>
              <input {...inputProps("subject")} className="input" placeholder="Email subject" />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="field-message">
                Message <span className="field-optional">(optional)</span>
              </label>
              <textarea
                {...inputProps("message")}
                className="input textarea"
                rows={4}
                placeholder="Your message…"
              />
            </div>
          </>
        );

      case "Phone":
        return (
          <div className="field">
            <label className="field-label" htmlFor="field-phone">
              Phone number
            </label>
            <input
              {...inputProps("phone")}
              className="input"
              type="tel"
              autoComplete="off"
              placeholder="+91 98765 43210"
            />
            {fieldError("phone") ? (
              <FieldError id="field-phone-error" message={fieldError("phone")} />
            ) : (
              <p className="field-hint">Include the country code, like +91 or +1.</p>
            )}
          </div>
        );

      case "Wi-Fi":
        return (
          <>
            <div className="field">
              <label className="field-label" htmlFor="field-ssid">
                Network name (SSID)
              </label>
              <input
                {...inputProps("ssid")}
                className="input"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                placeholder="My Wi-Fi network"
              />
              <FieldError id="field-ssid-error" message={fieldError("ssid")} />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="wifi-security">
                Security
              </label>
              <Select
                id="wifi-security"
                label="Wi-Fi security"
                value={fields.security}
                options={SECURITY_OPTIONS}
                onChange={(security) => setFields((current) => ({ ...current, security }))}
                block
              />
            </div>

            {fields.security !== "nopass" && (
              <div className="field">
                <label className="field-label" htmlFor="field-password">
                  Password
                </label>
                <div className="input-affix">
                  <input
                    {...inputProps("password")}
                    className="input"
                    type={showPassword ? "text" : "password"}
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    placeholder="Wi-Fi password"
                  />
                  <button
                    type="button"
                    className="affix-button"
                    onClick={() => setShowPassword((current) => !current)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <FieldError id="field-password-error" message={fieldError("password")} />
              </div>
            )}
          </>
        );
    }
  };

  /* ---------------------------
     Preview status
  ---------------------------- */

  const status = !showQR
    ? { tone: "idle", label: "Waiting for input" }
    : scanCheck.lowContrast
      ? { tone: "warn", label: "Low contrast" }
      : { tone: "ok", label: "Scan-safe" };

  /* ---------------------------
     Render
  ---------------------------- */

  return (
    <div className="app">
      <div className="app-bg" aria-hidden="true" />

      <header className="navbar">
        <div className="navbar-inner">
          <div className="brand">
            <div className="brand-icon">
              <QRIcon />
            </div>
            <div>
              <h1>QR Studio</h1>
              <p>Design beautiful QR codes</p>
            </div>
          </div>

          <button
            type="button"
            className="icon-toggle"
            onClick={toggleTheme}
            aria-label={appTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={appTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {appTheme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </header>

      <main className="main-container">
        {/* ============ EDITOR ============ */}
        <section className="panel editor-panel" aria-label="QR code editor">
          <div className="block">
            <div className="block-head">
              <h2 className="eyebrow">QR type</h2>
              <button type="button" className="link-button" onClick={resetAll}>
                <ResetIcon />
                Reset
              </button>
            </div>

            <div className="segmented" role="group" aria-label="QR type">
              {QR_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`segment${qrType === type ? " is-active" : ""}`}
                  aria-pressed={qrType === type}
                  onClick={() => switchType(type)}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="fields">{renderInputs()}</div>

            {payload.errors.general && (
              <p className="note note--error" role="alert">
                {payload.errors.general}
              </p>
            )}
          </div>

          <div className="block">
            <div className="block-head">
              <h2 className="eyebrow">Design</h2>
              <span className="theme-badge">{themeName || "Custom colors"}</span>
            </div>

            <div className="theme-grid" role="group" aria-label="QR themes">
              {presets.map((preset) => {
                const selected = themeName === preset.name;

                return (
                  <button
                    key={preset.name}
                    type="button"
                    className={`theme-card${selected ? " is-selected" : ""}`}
                    aria-pressed={selected}
                    onClick={() => applyPreset(preset)}
                  >
                    <ThemePreview preset={preset} />
                    <span className="theme-name">{preset.name}</span>
                    {selected && (
                      <span className="theme-check" aria-hidden="true">
                        <CheckIcon />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="controls">
              <div className="control">
                <div className="control-head">
                  <label className="control-label" htmlFor="size-range">
                    Size
                  </label>
                  <output htmlFor="size-range">{size} px</output>
                </div>
                <input
                  id="size-range"
                  className="range"
                  type="range"
                  min={SIZE_MIN}
                  max={SIZE_MAX}
                  step={SIZE_STEP}
                  value={size}
                  style={rangeStyle(size, SIZE_MIN, SIZE_MAX)}
                  aria-valuetext={`${size} pixels`}
                  onChange={(event) => setSize(Number(event.target.value))}
                />
              </div>

              <div>
                <div className="color-grid">
                  <div className="color-field">
                    <span className="control-label">Foreground</span>
                    <label className="color-picker">
                      <input
                        type="color"
                        value={design.foreground}
                        aria-label="Foreground color"
                        onChange={(event) => changeForeground(event.target.value)}
                      />
                      <span className="color-value">{design.foreground.toUpperCase()}</span>
                    </label>
                  </div>

                  <div className="color-field">
                    <span className="control-label">Background</span>
                    <label className="color-picker">
                      <input
                        type="color"
                        value={design.background}
                        aria-label="Background color"
                        onChange={(event) => changeBackground(event.target.value)}
                      />
                      <span className="color-value">{design.background.toUpperCase()}</span>
                    </label>
                  </div>
                </div>

                {scanCheck.lowContrast && (
                  <p className="note note--warn">
                    <strong>Low contrast ({scanCheck.ratio.toFixed(1)}:1).</strong> Phones may have
                    trouble reading this. Try a darker foreground or a lighter background.
                  </p>
                )}

                {!scanCheck.lowContrast && scanCheck.inverted && (
                  <p className="note note--info">
                    Light-on-dark codes scan on most modern phones, but some older scanners prefer
                    dark-on-light.
                  </p>
                )}
              </div>

              <div className="control">
                <div className="control-head">
                  <label className="control-label" htmlFor="margin-range">
                    Margin
                  </label>
                  <output htmlFor="margin-range">{margin} px</output>
                </div>
                <input
                  id="margin-range"
                  className="range"
                  type="range"
                  min={0}
                  max={MARGIN_MAX}
                  value={margin}
                  style={rangeStyle(margin, 0, MARGIN_MAX)}
                  aria-valuetext={`${margin} pixels`}
                  onChange={(event) => setMargin(Number(event.target.value))}
                />
                {margin < 8 && (
                  <p className="note note--info">
                    Very small margin. Leave some empty space around the code so scanners can find
                    its edges.
                  </p>
                )}
              </div>

              <div className="control control--inline">
                <div className="control-text">
                  <span className="control-label">Error correction</span>
                  <span className="control-hint">
                    Higher levels survive smudges but make the code denser.
                  </span>
                </div>
                <Select
                  id="error-level"
                  label="Error correction"
                  value={errorLevel}
                  options={LEVEL_OPTIONS}
                  onChange={setErrorLevel}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ============ PREVIEW ============ */}
        <section className="panel preview-panel" aria-label="QR code preview">
          <div className="preview-header">
            <div>
              <span className="eyebrow">Live preview</span>
              <h2>Your QR Code</h2>
            </div>

            <span className={`status status--${status.tone}`} role="status">
              {status.label}
            </span>
          </div>

          <div className="qr-stage">
            <div
              ref={qrRef}
              className={`qr-output${showQR ? "" : " is-hidden"}`}
              style={{ "--qr-display": `${Math.min(size, 340)}px` } as CSSProperties}
              role="img"
              aria-label={`${qrType} QR code preview`}
            />

            {!showQR && (
              <div className="qr-empty">
                <div className="qr-empty-icon">
                  <QRIcon />
                </div>
                <strong>Nothing to preview yet</strong>
                <span>{EMPTY_HINTS[qrType]}</span>
              </div>
            )}
          </div>

          <p className="qr-meta">
            {showQR
              ? `${size} × ${size} px · ${LEVEL_LABELS[errorLevel]} error correction · ${
                  themeName || "Custom colors"
                }`
              : ""}
          </p>

          <div className="download-buttons">
            <button
              type="button"
              className="btn btn--primary"
              disabled={isUpdating}
              onClick={() => {
                void handleDownload("png");
              }}
            >
              <DownloadIcon />
              Download PNG
            </button>

            <button
              type="button"
              className="btn btn--secondary"
              disabled={isUpdating}
              onClick={() => {
                void handleDownload("svg");
              }}
            >
              <DownloadIcon />
              Download SVG
            </button>
          </div>

          {recents.length > 0 && (
            <section className="recent" aria-labelledby="recent-title">
              <div className="recent-head">
                <h3 className="eyebrow" id="recent-title">
                  Recent QR codes
                </h3>
                <button type="button" className="link-button" onClick={clearRecents}>
                  Clear all
                </button>
              </div>

              <ul className="recent-list">
                {recents.map((item) => (
                  <li key={item.id} className="recent-row">
                    <button
                      type="button"
                      className="recent-item"
                      onClick={() => loadRecent(item)}
                      title="Restore this QR code and its settings"
                    >
                      <span className="recent-swatch" style={{ background: item.design.background }}>
                        <span
                          style={{
                            background: `linear-gradient(135deg, ${item.design.gradientStart}, ${item.design.gradientEnd})`,
                          }}
                        />
                      </span>
                      <span className="recent-text">
                        <span className="recent-type">{item.type}</span>
                        <span className="recent-label">{item.label}</span>
                      </span>
                    </button>

                    <button
                      type="button"
                      className="icon-button"
                      aria-label={`Remove ${item.type} QR code ${item.label}`}
                      onClick={() => removeRecent(item.id)}
                    >
                      <CloseIcon />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </section>
      </main>

      <div className="toast-region" role="status" aria-live="polite">
        {toast && <div className="toast">{toast}</div>}
      </div>
    </div>
  );
}

export default App;
