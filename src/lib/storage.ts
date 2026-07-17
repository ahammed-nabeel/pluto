import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

export type StorageProvider = "local" | "s3";

export type UploadResult = {
  url: string;
  key: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
};

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");

// ── Local Storage ─────────────────────────────────────

async function uploadLocal(file: File): Promise<UploadResult> {
  await mkdir(UPLOAD_DIR, { recursive: true });

  const ext = file.name.split(".").pop() ?? "bin";
  const key = `${uuidv4()}.${ext}`;
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  await writeFile(join(UPLOAD_DIR, key), buffer);

  return {
    url: `/uploads/${key}`,
    key,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
  };
}

// ── S3 Storage ────────────────────────────────────────

async function uploadS3(file: File): Promise<UploadResult> {
  // Dynamic import to avoid bundling AWS SDK when using local storage
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");

  const client = new S3Client({
    region: process.env.AWS_REGION ?? "ap-south-1",
    ...(process.env.S3_ENDPOINT ? { endpoint: process.env.S3_ENDPOINT } : {}),
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  const ext = file.name.split(".").pop() ?? "bin";
  const key = `proteus/${uuidv4()}.${ext}`;
  const bytes = await file.arrayBuffer();
  const bucket = process.env.S3_BUCKET_NAME!;

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: Buffer.from(bytes),
      ContentType: file.type,
      ContentLength: file.size,
    })
  );

  const endpoint = process.env.S3_ENDPOINT ?? `https://s3.${process.env.AWS_REGION}.amazonaws.com`;
  const url = `${endpoint}/${bucket}/${key}`;

  return {
    url,
    key,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
  };
}

// ── Public API ────────────────────────────────────────

export async function uploadFile(file: File): Promise<UploadResult> {
  const provider: StorageProvider =
    (process.env.STORAGE_PROVIDER as StorageProvider) ?? "local";

  // Validate file size (max 50MB)
  const MAX_SIZE = 50 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new Error("File size exceeds 50MB limit");
  }

  // Validate MIME types
  const ALLOWED_TYPES = [
    "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
    "video/mp4", "video/webm", "video/quicktime",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain", "text/csv",
  ];

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`File type ${file.type} is not allowed`);
  }

  if (provider === "s3") {
    return uploadS3(file);
  }
  return uploadLocal(file);
}

export async function deleteFile(key: string): Promise<void> {
  const provider: StorageProvider =
    (process.env.STORAGE_PROVIDER as StorageProvider) ?? "local";

  if (provider === "s3") {
    const { S3Client, DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    const client = new S3Client({
      region: process.env.AWS_REGION ?? "ap-south-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
    await client.send(
      new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET_NAME!, Key: key })
    );
  } else {
    const { unlink } = await import("fs/promises");
    await unlink(join(UPLOAD_DIR, key)).catch(() => {});
  }
}
