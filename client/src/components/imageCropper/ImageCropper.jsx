import { useRef, useState, useEffect } from 'react';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import './imageCropper.scss';
import { getCroppedImage } from '../../utils/imageProcessing';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';

const ImageCropper = ({ imageUrl, aspectRatio = 1, onCropComplete, onCancel }) => {
  const cropperRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cropperReady, setCropperReady] = useState(false);

  console.log('ImageCropper rendered with:', { imageUrl, aspectRatio });

  // Effect to check if image URL is valid
  useEffect(() => {
    console.log('ImageCropper: Checking image URL:', imageUrl);
    if (!imageUrl) {
      console.error('ImageCropper: No image URL provided');
      setError('No image URL provided');
      return;
    }

    // Create an image element to test if the URL is valid
    const img = new Image();
    img.onload = () => {
      console.log('ImageCropper: Image loaded successfully');
      setError(null);
    };
    img.onerror = () => {
      console.error('ImageCropper: Failed to load image from URL:', imageUrl);
      setError('Failed to load image');
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Effect to fix cropper opacity issues
  useEffect(() => {
    if (cropperReady) {
      const fixCropperOpacity = () => {
        const cropper = cropperRef.current?.cropper;
        if (!cropper) return;

        // Fix modal overlay
        const modalElements = document.querySelectorAll('.cropper-modal');
        modalElements.forEach(modal => {
          modal.style.opacity = '0';
          modal.style.display = 'none';
          modal.style.backgroundColor = 'transparent';
        });

        // Fix canvas and image opacity
        const canvasImages = document.querySelectorAll('.cropper-canvas img, .cropper-view-box img');
        canvasImages.forEach(img => {
          img.style.opacity = '1';
          img.style.filter = 'none';
        });

        // Fix container background
        const cropperContainers = document.querySelectorAll('.cropper-container');
        cropperContainers.forEach(container => {
          container.style.backgroundColor = 'transparent';
        });
      };

      // Apply fixes immediately and after a short delay to ensure they take effect
      fixCropperOpacity();
      const timeoutId = setTimeout(fixCropperOpacity, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [cropperReady]);

  const handleCrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      setLoading(true);
      setError(null);
      console.log('Starting crop operation...');
      
      const cropper = cropperRef.current?.cropper;
      if (!cropper) {
        throw new Error('Cropper not initialized');
      }

      console.log('Cropper instance found, getting cropped image...');
      const croppedImage = await getCroppedImage(cropper);
      console.log('Cropped image created:', croppedImage);
      
      onCropComplete(croppedImage);
    } catch (err) {
      console.error('Crop error:', err);
      setError(err.message || 'Failed to crop image');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    console.log('Cancel button clicked');
    onCancel();
  };

  console.log('ImageCropper rendering with:', { imageUrl, aspectRatio, loading, error, cropperReady });
  
  return (
    <div className="image-cropper" onClick={(e) => e.stopPropagation()}>
      <div className="cropper-container" onClick={(e) => e.stopPropagation()}>
        <div className="cropper-header">
          <h3>Crop Image</h3>
          <button 
            className="close-button"
            onClick={handleCancel}
            disabled={loading}
            type="button"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="cropper-content">
          <div className="cropper-wrapper">
            <Cropper
              ref={cropperRef}
              src={imageUrl}
              style={{ height: aspectRatio === 1 ? 350 : 300, width: '100%' }}
              aspectRatio={aspectRatio}
              initialAspectRatio={aspectRatio}
              guides={true}
              viewMode={1}
              dragMode="move"
              background={false}
              responsive={true}
              autoCropArea={aspectRatio === 1 ? 0.8 : 0.9}
              checkOrientation={false}
              cropBoxMovable={true}
              cropBoxResizable={true}
              toggleDragModeOnDblclick={false}
              minCropBoxHeight={80}
              minCropBoxWidth={80}
              modal={false}
              highlight={false}
              ready={() => {
                console.log('Cropper is ready');
                setCropperReady(true);
              }}
            />
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="cropper-actions">
          <button
            className="cancel-button"
            onClick={handleCancel}
            disabled={loading}
            type="button"
          >
            <CloseIcon />
            <span>Cancel</span>
          </button>
          <button
            className="apply-button"
            onClick={handleCrop}
            disabled={loading}
            type="button"
          >
            <CheckIcon />
            <span>{loading ? 'Saving...' : 'Apply'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper; 