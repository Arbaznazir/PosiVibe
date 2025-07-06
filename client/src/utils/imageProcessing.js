// Constants for image types and their configurations
export const IMAGE_TYPES = {
  PROFILE: {
    width: 400,
    height: 400,
    crop: "fill",
    gravity: "face",
    quality: 90,
  },
  COVER: {
    width: 1920,
    height: 480,
    crop: "fill",
    gravity: "auto",
    quality: 90,
  },
  POST: {
    width: 1080,
    height: 1080,
    crop: "fill",
    gravity: "auto",
    quality: 90,
  },
};

// Aspect ratios for different image types
export const PROFILE_RATIO = 1; // 1:1 square
export const COVER_RATIO = 4; // 4:1 landscape
export const POST_RATIO = 1; // 1:1 square

// Maximum file size in bytes (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed image types
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Validates an image file
 * @param {File} file - The image file to validate
 * @throws {Error} If validation fails
 */
export const validateImage = (file) => {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File size must be less than 5MB");
  }

  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Only JPEG, PNG and WebP images are allowed");
  }
};

/**
 * Converts a File object to a base64 string
 * @param {File} file - The file to convert
 * @returns {Promise<string>} A promise that resolves with the base64 string
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Gets a cropped image from a cropper instance
 * @param {Cropper} cropper - The cropper instance
 * @param {string} type - The type of image (profile, cover, post)
 * @returns {Promise<Blob>} A promise that resolves with the cropped image blob
 */
export const getCroppedImage = (cropper, type = "profile") => {
  return new Promise((resolve, reject) => {
    try {
      if (!cropper) {
        reject(new Error("Cropper instance is not available"));
        return;
      }

      const config = IMAGE_TYPES[type.toUpperCase()] || IMAGE_TYPES.PROFILE;

      const canvas = cropper.getCroppedCanvas({
        width: config.width,
        height: config.height,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: "high",
        fillColor: "#ffffff", // Ensure white background
      });

      if (!canvas) {
        reject(new Error("Failed to get cropped canvas"));
        return;
      }

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to create image blob"));
            return;
          }
          resolve(blob);
        },
        "image/jpeg",
        config.quality / 100
      );
    } catch (error) {
      reject(error);
    }
  });
};
