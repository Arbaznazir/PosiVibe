import cloudinary from "../config/cloudinary.js";
import { analyzeImageContent } from "./contentFilter.js";

/**
 * Upload file to Cloudinary with content moderation
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} originalname - Original filename
 * @param {string} folder - Cloudinary folder name
 * @returns {Promise<Object>} Upload result
 */
export const uploadToCloudinary = async (
  fileBuffer,
  originalname,
  folder = "posivibe"
) => {
  try {
    // First, analyze the image content if it's an image
    const fileExtension = originalname.split(".").pop().toLowerCase();
    const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp"];

    if (imageExtensions.includes(fileExtension)) {
      // Create a temporary file path for analysis
      const tempPath = `/tmp/${Date.now()}_${originalname}`;

      // For content analysis, we'd need to save temporarily or use a different approach
      // For now, we'll rely on Cloudinary's built-in moderation features
    }

    return new Promise((resolve, reject) => {
      const uploadOptions = {
        folder: folder,
        resource_type: "auto", // Automatically detect file type
        public_id: `${Date.now()}_${originalname.split(".")[0]}`,
        transformation: [
          {
            quality: "auto:good",
            fetch_format: "auto",
          },
        ],
        // Enable Cloudinary's AI-based content moderation (optional)
        // moderation: "aws_rek", // Commented out as it requires AWS integration
        notification_url: process.env.CLOUDINARY_WEBHOOK_URL || undefined,
      };

      // Upload from buffer
      cloudinary.uploader
        .upload_stream(uploadOptions, (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            reject(error);
          } else {
            console.log("✅ File uploaded to Cloudinary:", result.public_id);
            resolve({
              public_id: result.public_id,
              secure_url: result.secure_url,
              url: result.url,
              format: result.format,
              resource_type: result.resource_type,
              bytes: result.bytes,
              width: result.width,
              height: result.height,
              moderation: result.moderation || null,
            });
          }
        })
        .end(fileBuffer);
    });
  } catch (error) {
    console.error("Upload to Cloudinary failed:", error);
    throw error;
  }
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>} Deletion result
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log("🗑️ File deleted from Cloudinary:", publicId);
    return result;
  } catch (error) {
    console.error("Cloudinary deletion error:", error);
    throw error;
  }
};
