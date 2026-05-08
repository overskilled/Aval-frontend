/**
 * Cloudinary direct browser upload — no backend involvement.
 *
 * Setup (one-time, in the Cloudinary dashboard):
 *   1. Sign up at cloudinary.com.
 *   2. Settings → Upload → Add upload preset
 *      - Signing mode: Unsigned
 *      - (Optional) Folder: aval
 *      - Save and copy the preset name.
 *   3. Add to frontend/.env :
 *        VITE_CLOUDINARY_CLOUD_NAME=<your cloud name>
 *        VITE_CLOUDINARY_UPLOAD_PRESET=<preset name>
 *   4. Restart `npm run dev`.
 *
 * Two upload paths are exposed:
 *
 *   - `openUploadWidget(opts)` — opens Cloudinary's official Upload Widget.
 *     Drag-and-drop, camera, URL, multi-file, progress UI, i18n. Recommended
 *     for any user-facing upload (KYC, SKU images, etc.).
 *
 *   - `uploadToCloudinary(file)` — raw fetch POST. Useful for programmatic /
 *     headless uploads where you don't want the widget UI.
 *
 * Both use the same unsigned preset; the server never sees the bytes.
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const WIDGET_SCRIPT = "https://upload-widget.cloudinary.com/latest/global/all.js";

export function isCloudinaryConfigured() {
  return !!(CLOUD_NAME && UPLOAD_PRESET);
}

/* -------------------------------------------------------------------------- */
/*  Upload Widget                                                             */
/* -------------------------------------------------------------------------- */

let widgetScriptPromise = null;

function loadWidgetScript() {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.cloudinary && window.cloudinary.createUploadWidget) {
    return Promise.resolve();
  }
  if (widgetScriptPromise) return widgetScriptPromise;
  widgetScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${WIDGET_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => {
        widgetScriptPromise = null;
        reject(new Error("Failed to load Cloudinary upload widget"));
      }, { once: true });
      return;
    }
    const s = document.createElement("script");
    s.src = WIDGET_SCRIPT;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      widgetScriptPromise = null;
      reject(new Error("Failed to load Cloudinary upload widget"));
    };
    document.head.appendChild(s);
  });
  return widgetScriptPromise;
}

/**
 * Opens the Upload Widget. Resolves with the array of uploaded files when the
 * user closes the widget. Each item:
 *   { secureUrl, publicId, bytes, format, resourceType, originalFilename, mimeType }
 *
 * Options:
 *   folder        — namespace inside your Cloudinary library (e.g. `aval/kyc/<userId>`)
 *   multiple      — allow multiple files (default false)
 *   maxFileSize   — bytes (default 5 MB)
 *   resourceType  — 'image' | 'video' | 'raw' | 'auto' (default 'auto')
 *   sources       — which input sources to enable (default local + camera + url)
 *   clientAllowedFormats — array of file extensions, e.g. ['pdf','png','jpg']
 */
export async function openUploadWidget({
  folder,
  multiple = false,
  maxFileSize = 5 * 1024 * 1024,
  resourceType = "auto",
  sources = ["local", "camera", "url"],
  clientAllowedFormats,
} = {}) {
  if (!isCloudinaryConfigured()) {
    throw new Error(
      "Cloudinary n'est pas configuré. Définissez VITE_CLOUDINARY_CLOUD_NAME et VITE_CLOUDINARY_UPLOAD_PRESET dans frontend/.env",
    );
  }
  await loadWidgetScript();

  return new Promise((resolve, reject) => {
    const results = [];
    let settled = false;
    const finish = (val) => { if (!settled) { settled = true; resolve(val); } };

    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: CLOUD_NAME,
        uploadPreset: UPLOAD_PRESET,
        folder,
        multiple,
        maxFileSize,
        resourceType,
        sources,
        clientAllowedFormats,
        showPoweredBy: false,
        showAdvancedOptions: false,
        // Visual tone matches Aval's palette (parchment / ink / ochre).
        styles: {
          palette: {
            window: "#F4EDE0",
            sourceBg: "#FBF5E7",
            windowBorder: "#C9BFA8",
            tabIcon: "#14181F",
            inactiveTabIcon: "#6C6655",
            menuIcons: "#14181F",
            link: "#A85A2C",
            action: "#14181F",
            inProgress: "#A85A2C",
            complete: "#2C6B3F",
            error: "#8C2A2A",
            textDark: "#14181F",
            textLight: "#F4EDE0",
          },
        },
      },
      (error, result) => {
        if (error) {
          if (!settled) {
            settled = true;
            reject(new Error(error.message || error.statusText || String(error)));
          }
          return;
        }
        if (!result) return;
        if (result.event === "success") {
          const i = result.info;
          results.push({
            secureUrl: i.secure_url,
            publicId: i.public_id,
            bytes: i.bytes,
            format: i.format,
            resourceType: i.resource_type,
            originalFilename: i.original_filename,
            mimeType: i.resource_type === "image" && i.format
              ? `image/${i.format}`
              : i.resource_type === "raw" && i.format === "pdf"
              ? "application/pdf"
              : "application/octet-stream",
          });
        } else if (result.event === "queues-end" && !multiple) {
          // Single-file flow: auto-close the widget once the upload completes.
          widget.close();
        } else if (result.event === "close" || result.event === "abort") {
          finish(results);
        }
      },
    );
    widget.open();
  });
}

/* -------------------------------------------------------------------------- */
/*  Programmatic upload (no widget UI)                                        */
/* -------------------------------------------------------------------------- */

export async function uploadToCloudinary(file, { folder } = {}) {
  if (!isCloudinaryConfigured()) {
    throw new Error(
      "Cloudinary n'est pas configuré. Définissez VITE_CLOUDINARY_CLOUD_NAME et VITE_CLOUDINARY_UPLOAD_PRESET dans frontend/.env",
    );
  }
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", UPLOAD_PRESET);
  if (folder) form.append("folder", folder);

  const res = await fetch(url, { method: "POST", body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.message || `Upload failed (${res.status})`);
  }
  return {
    secureUrl: data.secure_url,
    publicId: data.public_id,
    bytes: data.bytes,
    format: data.format,
    resourceType: data.resource_type,
    originalFilename: data.original_filename,
  };
}
