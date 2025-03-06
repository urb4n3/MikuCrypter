import crypto from "crypto";
import fs from "fs";
import path from "path";
import util from "util";
import { Express } from "express";

const algorithm = "aes-256-cbc";
const randomBytes = util.promisify(crypto.randomBytes);

/**
 * Encrypts the uploaded file using AES-256-CBC.
 * - Derives a 256-bit key by SHA-256 hashing the `secret`.
 * - Generates a random 16-byte IV and writes it to the start of the output file.
 * - Streams the input through a Cipher, writing to the output file.
 */
export const encryptFile = async (
  file: Express.Multer.File,
  secret: string
) => {
  if (!secret) {
    throw new Error("No secret provided for encryption");
  }

  // Derive a 256-bit key from the user-provided secret
  const key = crypto.createHash("sha256").update(secret).digest();
  // Generate a 16-byte IV
  const iv = await randomBytes(16);

  const inputPath = file.path;
  const outputPath = `${file.path}.mikucrypt`;

  // Create the Cipher
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  // Create read and write streams
  const input = fs.createReadStream(inputPath);
  const output = fs.createWriteStream(outputPath);

  // Write the IV as the first 16 bytes of the file
  output.write(iv);

  // Pipe the encryption
  await new Promise<void>((resolve, reject) => {
    input
      .on("error", reject)
      .pipe(cipher)
      .on("error", reject)
      .pipe(output)
      .on("error", reject)
      .on("finish", resolve);
  });

  return {
    filename: `${file.filename}.mikucrypt`, // This is what we'll pass to res.download
    path: outputPath,
  };
};

/**
 * Decrypts a .mikucrypt file using AES-256-CBC.
 * - Reads the first 16 bytes (IV) from the input file.
 * - Derives the same key from `secret`.
 * - Streams the rest of the file (after the IV) through a Decipher.
 */
export const decryptFile = async (file: Express.Multer.File, secret: string) => {
  if (!secret) {
    throw new Error("No secret provided for decryption");
  }

  // Derive the key using SHA-256 from the secret
  const key = crypto.createHash("sha256").update(secret).digest();

  // Use the original filename for checking extension
  if (!file.originalname.endsWith(".mikucrypt")) {
    throw new Error("File does not have .mikucrypt extension. Please upload a valid encrypted file.");
  }

  // Use the Multer file path to read the file from disk
  const inputPath = file.path;
  // Derive the output filename by removing ".mikucrypt" from the original filename
  const outputFilename = file.originalname.replace(".mikucrypt", "");
  // Create an output path in the same directory
  const outputPath = path.join(path.dirname(file.path), outputFilename);

  // Read the first 16 bytes for the IV
  const fd = fs.openSync(inputPath, "r");
  const iv = Buffer.alloc(16);
  fs.readSync(fd, iv, 0, 16, 0);
  fs.closeSync(fd);

  const decipher = crypto.createDecipheriv(algorithm, key, iv);

  // Create streams: start reading from byte 16 to skip the IV
  const input = fs.createReadStream(inputPath, { start: 16 });
  const output = fs.createWriteStream(outputPath);

  await new Promise<void>((resolve, reject) => {
    input
      .on("error", reject)
      .pipe(decipher)
      .on("error", reject)
      .pipe(output)
      .on("error", reject)
      .on("finish", resolve);
  });

  return {
    filename: outputFilename,
    path: outputPath,
  };
};
