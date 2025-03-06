import express from "express";
import multer from "multer";
import { handleFileOperation } from "../controllers/fileController";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/process", upload.single("file"), handleFileOperation);

export default router;
