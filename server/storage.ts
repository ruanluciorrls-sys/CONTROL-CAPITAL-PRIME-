// Preconfigured storage helpers for Manus WebDev templates
// Uses the Biz-provided storage proxy (Authorization: Bearer <token>)

import { ENV } from './_core/env';

type StorageConfig = { baseUrl: string; apiKey: string };

function getStorageConfig(): StorageConfig {
  const baseUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;

  if (!baseUrl || !apiKey) {
    throw new Error(
      "Storage proxy credentials missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY"
    );
  }

  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
}

function buildUploadUrl(baseUrl: string, relKey: string): URL {
  const url = new URL("v1/storage/upload", ensureTrailingSlash(baseUrl));
  url.searchParams.set("path", normalizeKey(relKey));
  return url;
}

async function buildDownloadUrl(
  baseUrl: string,
  relKey: string,
  apiKey: string
): Promise<string> {
  const downloadApiUrl = new URL(
    "v1/storage/downloadUrl",
    ensureTrailingSlash(baseUrl)
  );
  downloadApiUrl.searchParams.set("path", normalizeKey(relKey));
  const response = await fetch(downloadApiUrl, {
    method: "GET",
    headers: buildAuthHeaders(apiKey),
  });
  return (await response.json()).url;
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function toFormData(
  data: Buffer | Uint8Array | string,
  contentType: string,
  fileName: string
): FormData {
  const blob =
    typeof data === "string"
      ? new Blob([data], { type: contentType })
      : new Blob([data as any], { type: contentType });
  const form = new FormData();
  form.append("file", blob, fileName || "file");
  return form;
}

function buildAuthHeaders(apiKey: string): HeadersInit {
  return { Authorization: `Bearer ${apiKey}` };
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const { baseUrl, apiKey } = getStorageConfig();
  const key = normalizeKey(relKey);
  const uploadUrl = buildUploadUrl(baseUrl, key);
  const formData = toFormData(data, contentType, key.split("/").pop() ?? key);
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: buildAuthHeaders(apiKey),
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(
      `Storage upload failed (${response.status} ${response.statusText}): ${message}`
    );
  }
  const url = (await response.json()).url;
  return { key, url };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string; }> {
  const { baseUrl, apiKey } = getStorageConfig();
  const key = normalizeKey(relKey);
  return {
    key,
    url: await buildDownloadUrl(baseUrl, key, apiKey),
  };
}

// Supabase Storage functions
import { createClient } from "@supabase/supabase-js";
import { nanoid } from "nanoid";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseClient: any = null;

function getSupabaseClient() {
  if (!supabaseClient && supabaseUrl && supabaseServiceRoleKey) {
    supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey);
  }
  return supabaseClient;
}

export interface SupabaseFile {
  key: string;
  url: string;
  bucket: string;
}

/**
 * Upload file to Supabase Storage
 */
export async function supabaseUploadFile(
  bucket: string,
  file: Buffer | string,
  contentType: string = "application/octet-stream"
): Promise<SupabaseFile> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase not configured");

  const fileName = `${nanoid()}-${Date.now()}`;
  const filePath = `${fileName}`;

  const { data, error } = await client.storage
    .from(bucket)
    .upload(filePath, file, {
      contentType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload file to ${bucket}: ${error.message}`);
  }

  const { data: urlData } = client.storage.from(bucket).getPublicUrl(filePath);

  return {
    key: data.path,
    url: urlData.publicUrl,
    bucket,
  };
}

/**
 * Upload JSON to Supabase Storage
 */
export async function supabaseUploadJSON(
  bucket: string,
  data: any,
  fileName?: string
): Promise<SupabaseFile> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase not configured");

  const jsonString = JSON.stringify(data, null, 2);
  const name = fileName || `${nanoid()}-${Date.now()}.json`;

  const { data: uploadData, error } = await client.storage
    .from(bucket)
    .upload(name, jsonString, {
      contentType: "application/json",
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload JSON to ${bucket}: ${error.message}`);
  }

  const { data: urlData } = client.storage.from(bucket).getPublicUrl(name);

  return {
    key: uploadData.path,
    url: urlData.publicUrl,
    bucket,
  };
}

/**
 * Download file from Supabase Storage
 */
export async function supabaseDownloadFile(
  bucket: string,
  filePath: string
): Promise<Buffer> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase not configured");

  const { data, error } = await client.storage.from(bucket).download(filePath);

  if (error) {
    throw new Error(`Failed to download file from ${bucket}: ${error.message}`);
  }

  return Buffer.from(await data.arrayBuffer());
}

/**
 * Delete file from Supabase Storage
 */
export async function supabaseDeleteFile(
  bucket: string,
  filePath: string
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase not configured");

  const { error } = await client.storage.from(bucket).remove([filePath]);

  if (error) {
    throw new Error(`Failed to delete file from ${bucket}: ${error.message}`);
  }
}
