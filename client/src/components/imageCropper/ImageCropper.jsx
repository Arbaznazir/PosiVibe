import { useRef, useState } from 'react';
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

  console.log('ImageCropper rendered with:', { imageUrl, aspectRatio });

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
              style={{ height: 400, width: '100%' }}
              aspectRatio={aspectRatio}
              guides={true}
              viewMode={1}
              dragMode="move"
              background={false}
              responsive={true}
              autoCropArea={1}
              checkOrientation={false}
              cropBoxMovable={true}
              cropBoxResizable={true}
              toggleDragModeOnDblclick={false}
              minCropBoxHeight={100}
              minCropBoxWidth={100}
              modal={false}
              highlight={false}
              ready={() => {
                console.log('Cropper is ready');
                const cropper = cropperRef.current?.cropper;
                if (cropper) {
                  // Force image to be opaque
                  const image = cropper.image;
                  if (image) {
                    image.style.opacity = '1';
                    image.style.filter = 'none';
                  }
                  
                  // Disable modal overlay
                  const modal = cropper.container.querySelector('.cropper-modal');
                  if (modal) {
                    modal.style.display = 'none';
                    modal.style.opacity = '0';
                  }
                  
                  // Force canvas image opacity
                  const canvas = cropper.container.querySelector('.cropper-canvas img');
                  if (canvas) {
                    canvas.style.opacity = '1';
                    canvas.style.filter = 'none';
                  }
                  
                  // Apply fixes after a short delay to ensure DOM is updated
                  setTimeout(() => {
                    const allImages = cropper.container.querySelectorAll('img');
                    allImages.forEach(img => {
                      img.style.opacity = '1';
                      img.style.filter = 'none';
                    });
                    
                    const allModals = cropper.container.querySelectorAll('.cropper-modal');
                    allModals.forEach(modal => {
                      modal.style.display = 'none';
                      modal.style.opacity = '0';
                    });
                  }, 100);
                }
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