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

  const handleCrop = async () => {
    try {
      setLoading(true);
      setError(null);
      const cropper = cropperRef.current?.cropper;
      if (!cropper) {
        throw new Error('Cropper not initialized');
      }

      const croppedImage = await getCroppedImage(cropper);
      onCropComplete(croppedImage);
    } catch (err) {
      setError(err.message || 'Failed to crop image');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="image-cropper">
      <div className="cropper-container">
        <div className="cropper-header">
          <h3>Crop Image</h3>
          <button 
            className="close-button"
            onClick={onCancel}
            disabled={loading}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="cropper-content">
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
          />
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="cropper-actions">
          <button
            className="cancel-button"
            onClick={onCancel}
            disabled={loading}
          >
            <CloseIcon />
            <span>Cancel</span>
          </button>
          <button
            className="apply-button"
            onClick={handleCrop}
            disabled={loading}
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