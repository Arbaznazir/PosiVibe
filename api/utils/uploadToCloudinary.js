import { cloudinary } from "../config/cloudinary.js";

export const uploadToCloudinary = async (
  fileBuffer,
  filename,
  folder = "posivibe",
  transformations = {}
) => {
  try {
    console.log("📤 Cloudinary upload starting:", {
      filename,
      folder,
      bufferSize: fileBuffer ? fileBuffer.length : 0,
      transformations,
    });

    // Handle different input types
    let uploadData;

    if (typeof fileBuffer === "string" && fileBuffer.startsWith("data:")) {
      // Already base64 data URL
      uploadData = fileBuffer;
    } else if (Buffer.isBuffer(fileBuffer)) {
      // Convert buffer to base64 data URL
      const base64Image = fileBuffer.toString("base64");
      uploadData = `data:image/jpeg;base64,${base64Image}`;
    } else {
      throw new Error("Invalid file data format");
    }

    // Upload to Cloudinary with transformations
    const result = await cloudinary.uploader.upload(uploadData, {
      folder: folder,
      resource_type: "auto",
      public_id: filename ? filename.split(".")[0] : undefined, // Use filename without extension
      transformation: [
        {
          width: transformations.width || 800,
          height: transformations.height || 600,
          crop: transformations.crop || "fill",
          gravity: transformations.gravity || "auto",
          quality: transformations.quality || 90,
          format: transformations.format || "jpg",
        },
      ],
    });

    console.log("✅ Cloudinary upload successful:", {
      public_id: result.public_id,
      secure_url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    });

    return result; // Return full result object
  } catch (error) {
    console.error("❌ Cloudinary upload error:", {
      error: error.message,
      stack: error.stack,
      filename,
      folder,
      bufferSize: fileBuffer ? fileBuffer.length : 0,
    });
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
    if (!publicId) {
      throw new Error("Public ID is required");
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      invalidate: true, // Invalidate CDN cache
    });

    if (result.result !== "ok") {
      throw new Error(`Failed to delete file: ${result.result}`);
    }

    console.log("🗑️ File deleted from Cloudinary:", publicId);
    return result;
  } catch (error) {
    console.error("Cloudinary deletion error:", error);
    throw error;
  }
};

/**
 * Generate Cloudinary URL with optimization
 * @param {string} publicId - Cloudinary public ID
 * @param {Object} options - Transform options
 * @returns {string} Optimized URL
 */
export const getOptimizedUrl = (publicId, options = {}) => {
  const defaultOptions = {
    quality: "auto:good",
    fetch_format: "auto",
    dpr: "auto",
    responsive: true,
  };

  const finalOptions = { ...defaultOptions, ...options };
  return cloudinary.url(publicId, finalOptions);
};
