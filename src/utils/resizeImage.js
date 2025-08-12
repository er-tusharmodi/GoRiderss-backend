import sharp from "sharp";
import path from "path";
import fs from "fs";

const compressImage = async (inputPath, quality = 75) => {
  try {
    const ext = path.extname(inputPath).toLowerCase();
    const outputPath = inputPath.replace(ext, ".webp");

    await sharp(inputPath)
      .resize({ width: 800 }) // Optional resizing
      .webp({ quality })      // Convert to WebP
      .toFile(outputPath);

    // Check if original file exists before deleting
    if (fs.existsSync(inputPath)) {
      fs.unlinkSync(inputPath); // Delete original image safely
    }

    return outputPath;
  } catch (err) {
    throw new Error("Image compression failed: " + err.message);
  }
};

export { compressImage };
