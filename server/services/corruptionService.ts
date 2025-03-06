import fs from "fs";
import { Transform } from "stream";
import { Express } from "express";

class CorruptAllTransform extends Transform {
  _transform(chunk: Buffer, encoding: BufferEncoding, callback: Function) {
    for (let i = 0; i < chunk.length; i++) {
      chunk[i] = Math.floor(Math.random() * 256);
    }
    this.push(chunk);
    callback();
  }
}

export const corruptFile = async (file: Express.Multer.File) => {
  const inputPath = file.path;
  const outputPath = `${file.path}.corrupt`;

  const input = fs.createReadStream(inputPath);
  const output = fs.createWriteStream(outputPath);
  const transform = new CorruptAllTransform();

  await new Promise<void>((resolve, reject) => {
    input
      .on("error", reject)
      .pipe(transform)
      .on("error", reject)
      .pipe(output)
      .on("error", reject)
      .on("finish", resolve);
  });

  return {
    filename: file.filename + ".corrupt",
    path: outputPath,
  };
};
