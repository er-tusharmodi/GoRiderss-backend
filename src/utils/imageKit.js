import ImageKit from "imagekit";
import dotenv from "dotenv";
import path from "path"
import fs from "fs";
import { apiError } from "./apiError.js";
import { v4 as uuidv4 } from 'uuid';
dotenv.config();

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

const uploadImage = async (filePath, folder = "", oldFileId="") => {
  try {
    const ext = path.extname(filePath).toLowerCase(); // get .jpg/.png/etc.
    const fileBuffer = fs.readFileSync(filePath);
    const allowedExt = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
    if (!allowedExt.includes(ext)) {
        throw new apiError(401,"Only image files are allowed")
    }
    if(oldFileId){
      await imagekit.deleteFile(oldFileId);
    }
    const fileName = `IMG_${uuidv4()}${ext}`; // random name with same extension
    const response = await imagekit.upload({
      file: fileBuffer,
      fileName,
      folder,
    });
    fs.unlinkSync(filePath);
    return {
      success: true,
      url: response.url,
      fileId: response.fileId,
    };
  } catch (error) {
    throw new apiError(500,"Something went wrong")
  }
};

const deleteImage = async (fileId) => {
  try {
    if(!fileId){
      throw new apiError(401,"FileID is required")
    }
    await imagekit.deleteFile(fileId);
  } catch (error) {
    throw new apiError(500,"Something went wrong")
  }
}

export {uploadImage,deleteImage};
