// Uploads a big video straight from the browser to Cloudinary in 20 MB chunks.
// The file never passes through our Node server, so there is no server
// timeout / memory problem and no 100 MB request-body limit.
//
// Needs GET {API_BASE}/api/training/upload-signature (see trainingrcaRoutes.js).
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const CHUNK_SIZE = 20 * 1024 * 1024; // 20 MB (Cloudinary minimum is 5 MB, except last chunk)
const MAX_RETRIES = 3;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function sendChunk({ url, sig, blob, fileName, uniqueId, start, end, total, signal }) {
  const fd = new FormData();
  fd.append("file", blob, fileName);
  fd.append("api_key", sig.apiKey);
  fd.append("timestamp", sig.timestamp);
  fd.append("signature", sig.signature);
  fd.append("folder", sig.folder);
  fd.append("public_id", sig.public_id);

  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        body: fd,
        signal,
        headers: {
          "X-Unique-Upload-Id": uniqueId,
          "Content-Range": `bytes ${start}-${end - 1}/${total}`,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error?.message || `Upload failed (${res.status})`);
      return data;
    } catch (e) {
      if (signal?.aborted) throw new Error("Upload cancelled");
      lastErr = e;
      await sleep(1500 * attempt); // small backoff, then retry the same chunk
    }
  }
  throw lastErr;
}

/**
 * @param {File} file
 * @param {(percent:number)=>void} [onProgress]
 * @param {AbortSignal} [signal] pass an AbortController's signal to cancel
 * @returns {Promise<{ url:string, publicId:string, duration?:number }>}
 */
export async function uploadVideoChunked(file, onProgress, signal) {
  const { data } = await axios.get(`${API_BASE}/api/training/upload-signature`);
  const sig = data.data;
  const url = `https://api.cloudinary.com/v1_1/${sig.cloudName}/video/upload`;

  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const total = file.size;
  let start = 0;
  let last = null;

  while (start < total) {
    if (signal?.aborted) throw new Error("Upload cancelled");
    const end = Math.min(start + CHUNK_SIZE, total);
    last = await sendChunk({
      url, sig, blob: file.slice(start, end), fileName: file.name,
      uniqueId, start, end, total, signal,
    });
    start = end;
    onProgress?.(Math.round((start / total) * 100));
  }

  if (!last?.secure_url) throw new Error("Cloudinary did not return a video URL");
  return { url: last.secure_url, publicId: last.public_id, duration: last.duration };
}

// ✅ NEW — plain single-shot upload for small files (PDFs). No chunking needed:
// Cloudinary raw uploads and our own 20 MB PDF cap are well under any request limit.
export async function uploadPdfDirect(file, signal) {
  const { data } = await axios.get(`${API_BASE}/api/training/upload-signature`, { params: { kind: "pdf" } });
  const sig = data.data;
  const url = `https://api.cloudinary.com/v1_1/${sig.cloudName}/raw/upload`;
  const fd = new FormData();
  fd.append("file", file);
  fd.append("api_key", sig.apiKey);
  fd.append("timestamp", sig.timestamp);
  fd.append("signature", sig.signature);
  fd.append("folder", sig.folder);
  fd.append("public_id", sig.public_id);
  const res = await fetch(url, { method: "POST", body: fd, signal });
  const out = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(out?.error?.message || `Upload failed (${res.status})`);
  return { url: out.secure_url, publicId: out.public_id };
}