import { cloudinary } from "../config/cloudinary.js";

export const uploadToCloudinary = async (file, transformations = {}) => {
  try {
    // Handle FormData file or base64 string
    let uploadData = file;

    // If it's FormData, extract the base64 data
    if (file.startsWith("data:")) {
      uploadData = file;
    } else {
      // Convert buffer to base64 if it's not already
      const base64Image = Buffer.from(file).toString("base64");
      uploadData = `data:image/jpeg;base64,${base64Image}`;
    }

    // Upload to Cloudinary with transformations
    const result = await cloudinary.uploader.upload(uploadData, {
      folder: "posivibe",
      resource_type: "auto",
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

    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
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
