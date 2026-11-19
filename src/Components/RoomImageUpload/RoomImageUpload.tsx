import React, { useState } from 'react';
import styles from './RoomImageUpload.module.css';
import { API_URL } from '../../config/api';
import { readJsonResponse } from '../../utils/readJsonResponse';

interface Props {
  roomId: string;
  currentImages: string[];
  onUploadSuccess: () => void;
}

export const RoomImageUpload: React.FC<Props> = ({ roomId, currentImages, onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Validate file count
    if (files.length > 10) {
      setError('Maximum 10 images allowed per upload');
      return;
    }

    // Validate total images
    if (currentImages.length + files.length > 20) {
      setError(`Room can have maximum 20 images. Currently: ${currentImages.length}`);
      return;
    }

    // Validate file types and sizes
    for (let i = 0; i < files.length; i++) {
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(files[i].type)) {
        setError('Only JPEG, PNG, WEBP and GIF images are allowed');
        return;
      }
      if (files[i].size > 10 * 1024 * 1024) {
        setError(`File "${files[i].name}" is too large. Maximum size is 10MB`);
        return;
      }
    }

    const input = e.currentTarget;
    const selectedFiles = Array.from(files);
    let saved = 0;
    setUploading(true);
    setError('');
    setUploadProgress(0);
    try {
      const token = localStorage.getItem('hotel_token');
      if (!token) throw new Error('Please sign in again before uploading images.');
      for (const file of selectedFiles) {
        const signed = await readJsonResponse(await fetch(`${API_URL}/admin/rooms/${roomId}/images/sign`, {
          method: 'POST', headers: { Authorization: `Bearer ${token}` },
        }));
        const { cloudName, apiKey, signature, params } = signed.data;
        const form = new FormData();
        form.append('file', file);
        form.append('api_key', apiKey);
        form.append('signature', signature);
        for (const [key, value] of Object.entries(params)) form.append(key, String(value));
        const uploaded = await readJsonResponse(await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`, { method: 'POST', body: form }));
        await readJsonResponse(await fetch(`${API_URL}/admin/rooms/${roomId}/images/complete`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicId: uploaded.public_id }),
        }));
        saved++;
        setUploadProgress(Math.round(saved / selectedFiles.length * 100));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload images';
      setError(saved ? `${saved} image(s) saved. ${message}` : message);
    } finally {
      input.value = '';
      setUploading(false);
      setUploadProgress(0);
      if (saved) onUploadSuccess();
    }
  };

  const handleDeleteImage = async (imageUrl: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const token = localStorage.getItem('hotel_token');
      const response = await fetch(`${API_URL}/admin/rooms/${roomId}/images`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ imageUrl }),
      });

      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.error || 'Delete failed');
      }

      onUploadSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to delete image');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Room Images</h3>
        <span className={styles.imageCount}>
          {currentImages.length} / 20 images
        </span>
      </div>

      {error && (
        <div className={styles.error}>
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')} className={styles.closeError}>×</button>
        </div>
      )}

      {currentImages.length === 0 && (
        <div className={styles.emptyState}>
          <p>No images uploaded yet</p>
          <p className={styles.hint}>Upload high-quality images to showcase this room</p>
        </div>
      )}

      {currentImages.length > 0 && (
        <div className={styles.imageGrid}>
          {currentImages.map((img, idx) => (
            <div key={idx} className={styles.imageCard}>
              <img src={img} alt={`Room ${idx + 1}`} loading="lazy" />
              <button
                className={styles.deleteBtn}
                onClick={() => handleDeleteImage(img)}
                title="Delete image"
                disabled={uploading}
              >
                ×
              </button>
              {idx === 0 && <span className={styles.primaryBadge}>Primary</span>}
            </div>
          ))}
        </div>
      )}

      <div className={styles.uploadSection}>
        <label className={`${styles.uploadBtn} ${uploading ? styles.uploading : ''}`}>
          {uploading ? (
            <span>
              Uploading... {uploadProgress}%
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill} 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </span>
          ) : (
            <span>Upload Images</span>
          )}
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileSelect}
            disabled={uploading || currentImages.length >= 20}
            style={{ display: 'none' }}
          />
        </label>
        <p className={styles.hint}>
          Max 10 images per upload • 10MB each • JPEG, PNG, WEBP, GIF
        </p>
      </div>
    </div>
  );
};
