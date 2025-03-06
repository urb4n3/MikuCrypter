import { encryptFile, decryptFile } from "./encryptionService";
import { corruptFile } from "./corruptionService";
import { Express } from "express";

export const processFileOperation = async (operation: string, file: Express.Multer.File, secret?: string) => {
  switch (operation) {
    case "encrypt":
      return encryptFile(file, secret!);
    case "decrypt":
      return decryptFile(file, secret!);
    case "corrupt":
      return corruptFile(file);
    default:
      throw new Error("Invalid operation");
  }
};
