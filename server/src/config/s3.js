import { S3Client } from "@aws-sdk/client-s3";

export const awsRegion = process.env.AWS_REGION || "ap-south-1";
export const awsBucketName = process.env.AWS_BUCKET_NAME || process.env.AWS_S3_BUCKET || "";

const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();

export const isS3Configured = Boolean(awsBucketName && accessKeyId && secretAccessKey);

export const s3 = new S3Client({
  region: awsRegion,
  ...(accessKeyId && secretAccessKey ? { credentials: { accessKeyId, secretAccessKey } } : {})
});

export function s3ObjectUrl(key) {
  const encodedKey = key.split("/").map(encodeURIComponent).join("/");
  return `https://${awsBucketName}.s3.${awsRegion}.amazonaws.com/${encodedKey}`;
}
