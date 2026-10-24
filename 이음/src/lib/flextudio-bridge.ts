/**
 * flextudio artifact ↔ container bridge
 *
 * One rule: inside the native app (isNative) delegate to the app over postMessage; everywhere else
 * (container web, FlipFront preview, standalone) handle it directly with browser APIs.
 * Only scanNFC and closeApp have no web fallback.
 *
 * The artifact is an iframe on a different origin than the container (app.html), so it cannot reach
 * parent globals directly.
 *   request - call a container global by name over postMessage (same payload as the engine's fCtn.callFunc)
 *   result  - native → container → {func, args} received over postMessage (function list at the end of this file)
 *   session - rides on the cookie (.flextudio.com), so fetch only needs credentials turned on
 *
 * Kept behaviorally in sync with the JS version (docs/ui-builder-artifact-bridge.js).
 */

/* ─── Environment ────────────────────────────────────────────────── */

// The container puts these on the iframe src (getSrc in engine/app-load.js)
const params = new URLSearchParams(location.search);

/** id the native result callback uses to find the target frame. Always send it along with a request */
export const viewId = params.get("flexviewid");

/** Whether we are running inside the native app (mirrors the runtime's f.Native.isOn) */
export const isNative = params.get("flexnative") === "1";

/** Data carried in by a deep link (push/app link). Mirrors f.Link.getLinkParam(). Parsed when it is JSON */
export const linkParam: unknown = (() => {
  const raw = params.get("linkParam");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw; // not JSON — hand back the string as-is
  }
})();

const inContainer = window.parent !== window;

/* ─── Diagnostic log buffer ───────────────────────────────────────────
 * DevTools cannot be opened inside a native webview, so messages crossing the
 * bridge are kept in memory and shown in an on-screen overlay (DebugOverlay).
 * Unrelated to the protocol itself.
 */

export type FlexLogDir = "out" | "in" | "info";
export interface FlexLogEntry {
  id: number;
  dir: FlexLogDir;
  func: string;
  detail: string;
  time: string;
}
type LogListener = (logs: FlexLogEntry[]) => void;

const MAX_LOGS = 200;
const logBuffer: FlexLogEntry[] = [];
const logListeners = new Set<LogListener>();
let logSeq = 0;

function detailOf(v: unknown): string {
  if (v === undefined) return "";
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function pushLog(dir: FlexLogDir, func: string, detail?: unknown): void {
  const time = new Date().toLocaleTimeString();
  logBuffer.push({ id: ++logSeq, dir, func, detail: detailOf(detail), time });
  if (logBuffer.length > MAX_LOGS) logBuffer.shift();
  const snapshot = logBuffer.slice();
  logListeners.forEach((l) => l(snapshot));
}

/** Subscribed by the overlay. Emits the current snapshot once immediately and returns an unsubscribe function */
export function subscribeLogs(fn: LogListener): () => void {
  logListeners.add(fn);
  fn(logBuffer.slice());
  return () => {
    logListeners.delete(fn);
  };
}

/** For the overlay's "clear" button */
export function clearLogs(): void {
  logBuffer.length = 0;
  logListeners.forEach((l) => l([]));
}

/* ─── Container messaging ────────────────────────────────────────── */

/**
 * Call a container global
 * @param func global function name. Dot notation is fine, e.g. "fNative.loadBarcode"
 * @param message argument (structured-cloneable values only)
 * @returns whether it was sent. Outside the container nothing is sent and this is false
 */
export function request(func: string, message?: unknown): boolean {
  if (!inContainer) {
    console.warn("[flex] 컨테이너 밖에서 실행 중 — 무시:", func);
    pushLog("info", `컨테이너 밖 — 무시됨: ${func}`, message);
    return false;
  }
  pushLog("out", func, message);
  window.parent.postMessage({ func, message }, "*");
  return true;
}

type Handler = { fn: (...args: any[]) => void; once: boolean };
const handlers: Record<string, Handler[]> = {};

window.addEventListener("message", (e: MessageEvent) => {
  if (e.source !== window.parent) return;

  const data = e.data;
  if (!data || typeof data.func !== "string") return;

  pushLog("in", data.func, data.args);

  const list = handlers[data.func];
  if (!list) return;

  handlers[data.func] = list.filter((h) => !h.once); // once handlers come off before they are invoked
  list.forEach((h) => h.fn.apply(null, data.args || []));
});

/**
 * Receive a result the container/native hands back
 * @param func result function name (the list is in the comment at the end of this file)
 * @param fn handler. Its arguments are exactly the args the engine passed
 * @param once receive once, then unsubscribe
 */
export function on(
  func: string,
  fn: (...args: any[]) => void,
  once = false,
): void {
  (handlers[func] = handlers[func] || []).push({ fn, once });
}

/** API call with the session attached. Drop credentials and the cookie is not sent (api is cross-origin) */
export function api(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`https://api.flextudio.com${path}`, {
    credentials: "include",
    ...init,
  });
}

type NativeResult<T> = {
  status?: { succeed?: boolean; message?: string; error?: string };
  data?: T;
};

/**
 * Waits for a native result shaped {status:{succeed,error,message}, data:{...}}
 * @param dismissed status.message values that count as a normal cancel — resolves null on a match
 */
function awaitStatusResult<T>(
  resultFunc: string,
  dismissed: string[] = [],
): Promise<T | null> {
  return new Promise((resolve, reject) => {
    on(
      resultFunc,
      (result: NativeResult<T>) => {
        const status = (result && result.status) || {};
        if (status.succeed) return resolve(result?.data ?? null);
        if (status.message && dismissed.indexOf(status.message) > -1)
          return resolve(null);
        reject(
          new Error(status.error || status.message || resultFunc + " failed"),
        );
      },
      true,
    );
  });
}

/* ─── f.Native counterparts ──────────────────────────────────────── */

// Closing the scanner (X) comes back from native with a message and no code, so we match on the string
const BARCODE_DISMISSED = [
  "스캐너가 닫혀 있습니다.",
  "Scanner was dismissed",
  "ScannerDismissed",
];

/** Barcode scan options. Native only forwards them; the web scanner is what interprets them */
export interface BarcodeOptions {
  facingMode?: "user" | "environment"; // rear camera preferred when unset
  isQR?: boolean; // 1:1 aspect ratio
  maxWidth?: number | string; // a number is px, strings like "80%" work too
  maxHeight?: number | string;
  closeBtnOnVideo?: boolean; // overlays the close button on the video instead of placing it above
  [key: string]: unknown;
}

/**
 * Barcode scan (f.Native.getBarcode)
 * On the web it opens a camera scanner (ZXing) itself. Inside an iframe the parent must grant allow="camera".
 * @returns the scanned value (an array when multi). null when the user closes the scanner
 */
export function getBarcode({
  multi = false,
  options = {},
}: { multi?: boolean; options?: BarcodeOptions } = {}): Promise<
  string | string[] | null
> {
  if (!isNative) return webGetBarcode(multi, options);

  const done = awaitStatusResult<string | string[]>(
    "setBarcode",
    BARCODE_DISMISSED,
  );
  request("fNative.loadBarcode", {
    id: viewId,
    ismulti: multi,
    param: {
      afterEventName: JSON.stringify({
        issync: false,
        eventname: "",
        ismulti: multi,
      }),
      options: JSON.stringify(options),
    },
  });
  return done;
}

/** Location result. Native gives strings, the web fallback gives numeric coordinates */
export interface GPSResult {
  latitude?: string | number;
  longitude?: string | number;
  address?: string;
}

/**
 * Location lookup (f.Native.getGPS)
 * On the web it goes straight to the browser geolocation API — a secure context (https/localhost) is
 * required, and inside an iframe the parent must grant allow="geolocation".
 * @param navigation true opens the native map app (ignored on the web)
 */
export function getGPS({
  navigation = false,
}: { navigation?: boolean } = {}): Promise<GPSResult | null> {
  if (!isNative) return webGetGPS();

  const done = awaitStatusResult<GPSResult>("setLocation");
  request("fNative.loadGPS", {
    id: viewId,
    isNavigator: navigation,
    // the engine carries isNavigator as a string, so match that exactly
    param: {
      afterEventName: JSON.stringify({
        issync: false,
        eventname: "",
        isNavigator: String(navigation),
      }),
    },
  });
  return done;
}

/* ─── Headless NFC scan state ─────────────────────────────────────────
 * The built-in overlay hardcodes #fff/#eee/#666, which is a jarring white card in an app themed
 * by the fx design tokens. An app that subscribes here draws the prompt itself and the built-in
 * overlay stays out of the DOM; the cancel/settle race below stays here so apps never rebuild it.
 */

export interface NfcScanState {
  /** True while a scan is waiting for a tag and the app should show its own prompt. */
  scanning: boolean;
  /** Aborts the in-flight scan; the scanNFC promise rejects with "canceled". No-op when not scanning. */
  cancel: () => void;
}

type NfcScanListener = (state: NfcScanState) => void;

const nfcScanListeners = new Set<NfcScanListener>();
// Concurrent scans are out of scope — one in-flight scan, one cancel.
let currentNfcCancel: (() => void) | null = null;

function cancelNfcScan(): void {
  currentNfcCancel?.();
}

function publishNfcScan(scanning: boolean): void {
  const state: NfcScanState = { scanning, cancel: cancelNfcScan };
  nfcScanListeners.forEach((l) => l(state));
}

/** Subscribed by the app to draw its own NFC prompt. Emits the current state immediately and returns an unsubscribe function */
export function subscribeNfcScan(fn: NfcScanListener): () => void {
  nfcScanListeners.add(fn);
  fn({ scanning: currentNfcCancel !== null, cancel: cancelNfcScan });
  return () => {
    nfcScanListeners.delete(fn);
  };
}

/**
 * NFC scan (f.Native.scanNFC) — native only (no web fallback)
 *
 * On iOS the OS puts up its own scan sheet (prompt + cancel) and a cancel comes back as an error.
 * Android has no OS UI at all and waits for a tag in silence — the overlay the runtime engine shows
 * (.nfc-wrap) does not exist in an artifact, so that role is filled here instead.
 * Native reports nothing on cancel, so this side ends it with a reject (same contract as the runtime).
 * @param timeout ms. Past it, reject("timeout"). 0 means no limit. 60s by default
 * @returns the tag value. A cancel is reject("canceled")
 */
export function scanNFC({
  timeout = 60000,
}: { timeout?: number } = {}): Promise<unknown> {
  if (!isNative)
    return Promise.reject(new Error("네이티브 앱에서만 사용할 수 있습니다"));

  return new Promise((resolve, reject) => {
    let settled = false;
    let overlay: HTMLElement | null = null;
    let timer: number | null = null;

    // A setNfcResult arriving late, after a cancel or timeout, must not settle a second time —
    // finish exactly once. Every terminating path flips the published scan state here, in one place.
    const settle = (fn: () => void) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      overlay?.remove();
      if (currentNfcCancel) {
        currentNfcCancel = null;
        publishNfcScan(false);
      }
      fn();
    };

    on(
      "setNfcResult",
      (error: unknown, result: unknown) => {
        if (error) settle(() => reject(new Error(String(error))));
        else settle(() => resolve(result));
      },
      true,
    );

    // Android only: iOS shows the OS scan sheet, so an app has nothing to render there and
    // publishing would only invite a second prompt on top of the system one.
    if (/android/i.test(navigator.userAgent)) {
      const cancel = () => settle(() => reject(new Error("canceled")));
      if (nfcScanListeners.size > 0) {
        currentNfcCancel = cancel;
        publishNfcScan(true);
      } else {
        overlay = createNfcOverlay(cancel);
        document.body.appendChild(overlay);
      }
    }
    if (timeout > 0) {
      timer = window.setTimeout(
        () => settle(() => reject(new Error("timeout"))),
        timeout,
      );
    }

    request("fNative.nfcScan", {});
  });
}

/**
 * Share sheet (f.Native.share)
 * On the web it uses the Web Share API. User activation does not survive postMessage, so this cannot be
 * handed to the container and the artifact calls it directly — call it from inside a click handler.
 */
export function share(text: string): boolean {
  if (isNative) return request("fNative.appShare", { param: { text } });

  if (typeof navigator.share === "function") {
    navigator.share({ text }).catch(() => {
      // the user closing the share sheet gives AbortError — ignore
    });
    return true;
  }
  console.warn("[flex] 이 브라우저는 공유를 지원하지 않습니다");
  return false;
}

/** Close the app (f.Native.close) — native only (the web cannot force a window shut) */
export function closeApp(): boolean {
  if (!isNative) return false;
  return request("fNative.closeApp");
}

// Shared path for openCall/openSMS/openMail. On the web, window.open must be called from inside a click handler
function openLink(url: string): boolean {
  if (!isNative) {
    window.open(url);
    return true;
  }
  return request("fNative.OpenLinkApp", {
    id: viewId,
    action: "OpenLinkApp",
    param: { andr: url, ios: url },
  });
}

/** Place a call (f.Native.openCall) */
export function openCall(number: string): boolean {
  return openLink("tel:" + number);
}

/** Send a text message (f.Native.openSMS) */
export function openSMS(number: string): boolean {
  return openLink("sms:" + number);
}

/** Compose mail (f.Native.openMail) */
export function openMail(address: string): boolean {
  return openLink("mailto:" + address);
}

/**
 * Public IP lookup (f.Native.getIP)
 * The runtime requests this over XHR itself, so it never goes through the bridge. It needs the session cookie, hence api().
 * @returns the public IP string (dug out as best we can even when the response shape differs)
 */
export async function getIP(): Promise<string> {
  const res = await api("/v1/publicip", { method: "POST" });
  if (!res.ok) throw new Error(`publicip 요청 실패 (HTTP ${res.status})`);
  const text = await res.text();
  try {
    const json = JSON.parse(text) as any;
    const ip =
      json?.ip ?? json?.data?.ip ?? json?.publicip ?? json?.data?.publicip;
    return typeof ip === "string" && ip ? ip : text.trim();
  } catch {
    return text.trim();
  }
}

/**
 * Clipboard write (f.Native.writeClipboard)
 * A cross-origin iframe is blocked without Permissions Policy (clipboard-write), and in that case the
 * error is thrown straight through — it is useful for diagnosis, so it is deliberately not swallowed.
 */
export function writeClipboard(text: string): Promise<void> {
  if (!navigator.clipboard?.writeText) {
    return Promise.reject(
      new Error("이 환경에서는 클립보드 API 를 쓸 수 없습니다"),
    );
  }
  return navigator.clipboard.writeText(text);
}

/* ─── Web fallback implementations ────────────────────────────────────
 * Same behavior as the f.Native web branch in the engine's publicscript.js (getGPS, loadPCBarcode).
 * Pure browser APIs only, so it works with or without the container.
 */

// Fills the address in from the coordinates (engine callAddressGeoAPI). On failure the coordinates still come back
async function geocodeAddress(data: GPSResult): Promise<GPSResult> {
  const key = "AIzaSyB5j4I0tc8fgdq0GV2dQ7_VFNYMekpSj_I";
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${data.latitude},${data.longitude}&location_type=ROOFTOP&result_type=street_address&key=${key}`;
  try {
    const res = await fetch(url);
    const json = (await res.json()) as any;
    const found = json.results?.[0]?.formatted_address;
    if (found) data.address = found;
    else
      console.warn(
        `[flex] geocode API - ${json.status} : ${json.error_message}`,
      );
  } catch {
    // network failure — return the coordinates alone
  }
  return data;
}

function webGetGPS(): Promise<GPSResult> {
  // Outside a secure context the browser GPS is unusable — return fixed coordinates, same as the engine
  if (!window.isSecureContext || !navigator.geolocation) {
    return geocodeAddress({
      latitude: 37.557023,
      longitude: 126.86429,
      address: "서울특별시 강서구 염창동",
    });
  }
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve(
          geocodeAddress({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            address: "Not Excuted on App",
          }),
        ),
      (err) => reject(new Error(err.message)),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  });
}

// ZXing loads through a script tag + global (window.ZXing) — works anywhere, with no bundler involvement
let zxingLoading: Promise<void> | null = null;
function loadZxingLib(): Promise<void> {
  if ((window as any).ZXing) return Promise.resolve();
  if (!zxingLoading) {
    zxingLoading = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.onload = () => resolve();
      script.onerror = () => {
        zxingLoading = null;
        reject(new Error("ZXing 라이브러리 로드 실패"));
      };
      script.src = "https://unpkg.com/@zxing/library@0.22.0/umd/index.min.js";
      document.head.appendChild(script);
    });
  }
  return zxingLoading;
}

// Given a facingMode, pick the front/rear camera precisely by device label
async function pickCamera(
  facingMode: string,
): Promise<MediaDeviceInfo | undefined> {
  let camState: PermissionState | undefined;
  try {
    camState = (
      await navigator.permissions.query({ name: "camera" as PermissionName })
    ).state;
  } catch {
    // Safari (older) and Firefox do not know 'camera' in permissions.query and throw.
    // With no label to read, the caller's facingMode ideal fallback picks the camera.
  }
  if (camState === "prompt") {
    // reading device.label needs permission first, so a temporary stream secures it
    const temp = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
    } as any);
    temp.getTracks().forEach((t) => t.stop());
  }
  const devices = await navigator.mediaDevices.enumerateDevices();
  const videos = devices.filter((d) => d.kind === "videoinput");
  return facingMode === "environment"
    ? videos.find((d) => /\bback\b|\brear\b|\bworld\b/i.test(d.label))
    : videos.find((d) => /\bfront\b|\buser\b|\bface\b|facetime/i.test(d.label));
}

// Camera stream + ZXing scan (same behavior as the engine's loadPCBarcode)
async function webGetBarcode(
  isMulti: boolean,
  options: BarcodeOptions = {},
): Promise<string | string[] | null> {
  if (typeof options !== "object" || !options) options = {};

  const facingMode = options.facingMode;
  const camera =
    facingMode === "user" || facingMode === "environment"
      ? await pickCamera(facingMode)
      : undefined;

  const isQRMode = !!options.isQR;
  const constraints: any = {
    video: {
      focusMode: "continuous",
      frameRate: { ideal: 30 },
      autoGainControl: true,
      aspectRatio: { exact: isQRMode ? 1 : 16 / 9 },
      brightness: { ideal: 0.5 },
      contrast: { ideal: 0.5 },
      saturation: { ideal: 0.5 },
      sharpness: { ideal: 0.5 },
      whiteBalanceMode: "continuous",
    },
  };
  constraints.video[camera ? "deviceId" : "facingMode"] = camera
    ? { exact: camera.deviceId }
    : { ideal: facingMode === "user" ? "user" : "environment" };

  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  await loadZxingLib();

  // correct the ratio for a portrait stream
  const track = stream.getVideoTracks()[0];
  const settings = track.getSettings();
  if ((settings.height ?? 0) > (settings.width ?? 0)) {
    try {
      await track.applyConstraints({
        aspectRatio: { exact: isQRMode ? 1 : 9 / 16 },
      } as any);
    } catch {
      // a failed applyConstraints is survivable
    }
  }

  const { dim, video, button } = createScanner(options);
  video.srcObject = stream;
  document.body.appendChild(dim);

  return new Promise<string | string[] | null>((resolve, reject) => {
    const scanned: string[] = [];
    const codeReader = new (window as any).ZXing.BrowserMultiFormatReader();

    function stopScanning() {
      try {
        codeReader.reset();
      } catch {
        // a failed ZXing reset is fine to ignore
      }
      stream.getTracks().forEach((t) => t.stop());
      dim.remove();
    }

    codeReader
      .decodeFromVideoElement(video)
      .then((decoded: any) => {
        scanned.push(decoded.text);
        if (!isMulti) {
          stopScanning();
          resolve(scanned[0]);
        }
      })
      .catch((err: any) => {
        stopScanning();
        // stopping the stream with the close button raises this error — the button handler owns the result
        if (err && err.toString().includes("Video stream has ended")) return;
        reject(new Error(err.toString()));
      });

    button.addEventListener("click", () => {
      stopScanning();
      // closed without a scan → null — same contract as a native dismiss
      resolve(isMulti && scanned.length > 0 ? scanned : null);
    });
  });
}

// Scanner overlay
function createScanner(options: BarcodeOptions): {
  dim: HTMLElement;
  video: HTMLVideoElement;
  button: HTMLButtonElement;
} {
  let dim = document.querySelector(".devScannerDim") as HTMLElement | null;
  if (!dim) {
    dim = document.createElement("div");
    dim.className = "devScannerDim";
    dim.style.cssText =
      "position:fixed;bottom:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;background-color:rgba(0,0,0,.3);overflow:hidden;z-index:9999";
    const btnPos = options.closeBtnOnVideo
      ? "position:absolute;right:0;top:0;"
      : "";
    dim.innerHTML = `<section style="position:relative;display:flex;flex-direction:column;align-items:flex-end">
        <button class="devBtnClose" style="${btnPos}display:flex;align-items:center;justify-content:center;width:2rem;height:2rem;border:0;padding:0;background-color:transparent;color:#fff;font-size:1.25rem;cursor:pointer">✕</button>
        <video class="devScannerVideo" autoplay muted playsinline style="width:100%"></video>
      </section>`;
  }
  const video = dim.querySelector(".devScannerVideo") as HTMLVideoElement;
  const button = dim.querySelector(".devBtnClose") as HTMLButtonElement;

  const size = (v: number | string) => (typeof v === "number" ? v + "px" : v);
  if (options.maxWidth) video.style.maxWidth = size(options.maxWidth);
  if (options.maxHeight) video.style.maxHeight = size(options.maxHeight);
  video.style.objectFit = "contain";
  return { dim, video, button };
}

// Android NFC prompt overlay. Only used when nothing subscribed to subscribeNfcScan — its colors are
// hardcoded and cannot follow the app's fx tokens, so a subscribed app draws its own instead.
function createNfcOverlay(onCancel: () => void): HTMLElement {
  const dim = document.createElement("div");
  dim.className = "devNfcDim";
  dim.style.cssText =
    "position:fixed;bottom:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;background-color:rgba(0,0,0,.5);z-index:9999";
  dim.innerHTML = `<section style="display:flex;flex-direction:column;align-items:center;gap:.75rem;padding:2rem 2.5rem;border-radius:12px;background:#fff;max-width:80%;text-align:center">
      <strong style="font-size:1.1rem">NFC 태그를 기기에 대주세요</strong>
      <span style="color:#666;font-size:.9rem">기기 뒷면을 태그에 가까이 하세요</span>
      <button type="button" class="devNfcCancel" style="margin-top:.5rem;padding:.6rem 2rem;border:0;border-radius:8px;background:#eee;font-size:1rem;cursor:pointer">취소</button>
    </section>`;
  dim.querySelector(".devNfcCancel")!.addEventListener("click", onCancel);
  return dim;
}

/*
 * ─── Result functions (container → artifact, callIntoView in engine/native-interface.js) ───
 *   setBarcode(result) / setLocation(result) / setNfcResult(error, result)
 *   onNativeError(msg, title) / onForeground() / checkNative(isOn)
 *
 * ─── Permissions ──────────────────────────────────────────────────
 * The container and the preview iframe must grant allow="clipboard-write; geolocation; camera",
 * or the web fallbacks (clipboard, location, camera) are blocked in a cross-origin child.
 * Standalone (a top-level document) only needs a secure context (https/localhost).
 * Even with the permissions open, the user's own consent prompt still appears.
 */

/**
 * Mirrors the url home route into the container's address bar
 * Called once at app start when served as the home (start) screen. The container ignores it otherwise.
 * React Router (HashRouter) changes the hash through pushState, so hashchange never fires —
 * pushState/replaceState are wrapped to catch every route change. Back navigation arrives as popstate/hashchange.
 */
export function mirrorRouteToContainer(): void {
  if (!inContainer) return;

  const report = () =>
    request("syncUrlHomeRoute", { id: viewId, hash: location.hash });

  for (const method of ["pushState", "replaceState"] as const) {
    const orig = history[method].bind(history);
    history[method] = (...args: Parameters<History["pushState"]>) => {
      orig(...args);
      report();
    };
  }
  window.addEventListener("hashchange", report);
  window.addEventListener("popstate", report);
  report(); // reflect the initial route too
}
