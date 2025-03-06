import fs from "fs";
import path from "path";
import { Request, Response } from "express";
import { processFileOperation } from "../services/fileService";

export const handleFileOperation = async (req: Request, res: Response) => {
  let result;
  try {
    const { operation, secret } = req.body;
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    result = await processFileOperation(operation, req.file, secret);

    res.download(result.path, result.filename, (err) => {
      if (err) {
        console.error("Error sending file:", err);
        res.status(500).json({ error: "Failed to send file" });
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    res.on("finish", () => {
      if (req.file && req.file.path) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error("Error removing input file:", err);
        });
      }
      if (result && result.path) {
        fs.unlink(result.path, (err) => {
          if (err) console.error("Error removing output file:", err);
        });
      }
    });
  }
};
