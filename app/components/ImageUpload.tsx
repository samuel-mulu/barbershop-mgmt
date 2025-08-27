"use client";
import { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, CheckCircle, AlertCircle } from 'lucide-react';

interface ImageUploadProps {
  onImageUpload: (imageUrl: string) => void;
  onImageRemove: () => void;
  currentImageUrl?: string;
  disabled?: boolean;
  cameraOnly?: boolean; // New prop to force camera-only mode
}

export default function ImageUpload({ 
  onImageUpload, 
  onImageRemove, 
  currentImageUrl, 
  disabled = false,
  cameraOnly = false
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file) return;

    // No file type or size restrictions - accept any image file

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Compress image before upload for better performance
      const compressedFile = await compressImage(file);
      setUploadProgress(20);

      const formData = new FormData();
      formData.append('image', compressedFile);

      const token = localStorage.getItem('token');
      setUploadProgress(40);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      setUploadProgress(80);

      const data = await response.json();

      if (response.ok && data.success) {
        onImageUpload(data.imageUrl);
        setUploadProgress(100);
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [onImageUpload]);

  // Image compression function
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions (max 800px width/height)
        const maxSize = 800;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            resolve(file); // Fallback to original file
          }
        }, 'image/jpeg', 0.7); // 70% quality for good balance
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileUpload = () => {
    // Check if we're on a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile && cameraOnly) {
      // For mobile devices in camera-only mode, use device camera for upload too
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment'; // Force rear camera on mobile
      input.style.display = 'none';
      
      input.onchange = (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
          handleFileSelect(file);
        }
        document.body.removeChild(input);
      };
      
      document.body.appendChild(input);
      input.click();
    } else if (isMobile && !cameraOnly) {
      // For mobile devices in normal mode, allow gallery selection
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      // Don't set capture attribute to allow gallery selection
      input.style.display = 'none';
      
      input.onchange = (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
          handleFileSelect(file);
        }
        document.body.removeChild(input);
      };
      
      document.body.appendChild(input);
      input.click();
    } else {
      // For desktop, use regular file input
      fileInputRef.current?.click();
    }
  };

  const startCamera = async () => {
    try {
      // Check if we're on a mobile device
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        // For mobile devices, always use the device camera app
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment'; // Force rear camera on mobile
        input.style.display = 'none';
        
        input.onchange = (event) => {
          const file = (event.target as HTMLInputElement).files?.[0];
          if (file) {
            handleFileSelect(file);
          }
          document.body.removeChild(input);
        };
        
        document.body.appendChild(input);
        input.click();
        return;
      }
      
      // For desktop, use web camera
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setShowCamera(true);
      }
    } catch (error) {
      console.error('❌ Camera error:', error);
      setError('Failed to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
    setCapturedImage(null);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'captured-image.jpg', { type: 'image/jpeg' });
            handleFileSelect(file);
            stopCamera();
          }
        }, 'image/jpeg', 0.8);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  return (
    <div className="space-y-4">
      {/* Current Image Display - Small Preview */}
      {currentImageUrl && (
        <div className="image-preview-container">
          <img 
            src={currentImageUrl} 
            alt="Payment proof" 
            className="w-32 h-24 object-cover"
          />
          <button
            type="button"
            onClick={onImageRemove}
            disabled={disabled}
            className="remove-button"
          >
            <X className="w-3 h-3" />
          </button>
          <div className="mt-2 text-xs text-green-600 font-medium text-center">
            ✅ Payment proof uploaded
          </div>
        </div>
      )}

      {/* Upload Interface */}
      {!currentImageUrl && !showCamera && (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            disabled 
              ? 'border-gray-300 bg-gray-50' 
              : cameraOnly
                ? 'border-green-300 bg-green-50 hover:border-green-400 hover:bg-green-100'
                : 'border-blue-300 bg-blue-50 hover:border-blue-400 hover:bg-blue-100'
          }`}
        >
          <div className="space-y-4">
                         {cameraOnly ? (
               // Camera-only mode for mobile banking with both options
               <div className="space-y-4">
                 <div className="flex justify-center space-x-4">
                   <button
                     type="button"
                     onClick={startCamera}
                     disabled={disabled || isUploading}
                     className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 font-semibold"
                   >
                     <Camera className="w-4 h-4" />
                     <span>📱 Camera</span>
                   </button>
                   
                   <button
                     type="button"
                     onClick={handleFileUpload}
                     disabled={disabled || isUploading}
                     className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 font-semibold"
                   >
                     <Upload className="w-4 h-4" />
                     <span>📁 Upload</span>
                   </button>
                 </div>
                 
                 <div className="text-center space-y-2">
                   <p className="text-sm text-green-700 font-medium">
                     📸 Mobile Banking Payment Proof Required
                   </p>
                   <p className="text-xs text-green-600">
                     Both options open your phone camera for payment confirmation
                   </p>
                   <p className="text-xs text-gray-500">
                     Camera: Direct capture, Upload: Camera with gallery option
                   </p>
                   <p className="text-xs text-gray-400">
                     You can also drag and drop an image here
                   </p>
                 </div>
               </div>
            ) : (
              // Normal mode with file upload and camera options
              <>
                <div className="flex justify-center space-x-4">
                  <button
                    type="button"
                    onClick={handleFileUpload}
                    disabled={disabled || isUploading}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    <span>📁 Choose File</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={startCamera}
                    disabled={disabled || isUploading}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? '📱 Phone Camera' : '📸 Camera'}</span>
                  </button>
                </div>
                
                <p className="text-xs text-gray-500">
                  Any image format and size accepted
                </p>
                {/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && (
                  <p className="text-xs text-blue-600">
                    📱 Choose File: Select from gallery, Camera: Take new photo
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Camera Interface */}
      {showCamera && (
        <div className="space-y-4">
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-64 object-cover rounded-lg"
            />
            <button
              type="button"
              onClick={stopCamera}
              className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="text-center space-y-3">
            {cameraOnly && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700 font-medium">
                  📱 Mobile Banking Payment Proof
                </p>
                <p className="text-xs text-green-600">
                  {/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
                    ? 'Using your phone camera app to capture payment confirmation'
                    : 'Position your payment confirmation screen in the camera view'
                  }
                </p>
                <p className="text-xs text-green-600 mt-1">
                  You can also upload existing images from your device
                </p>
              </div>
            )}
            
            <div className="flex justify-center space-x-4">
              <button
                type="button"
                onClick={captureImage}
                className={`px-6 py-3 text-white rounded-lg transition-colors font-semibold ${
                  cameraOnly 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                📸 {cameraOnly ? 'Capture Payment Proof' : 'Capture'}
              </button>
              <button
                type="button"
                onClick={stopCamera}
                className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Hidden Canvas for Camera Capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Loading State with Progress */}
      {isUploading && (
        <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span className="text-blue-600 font-medium">Uploading image...</span>
            </div>
            <span className="text-blue-600 text-sm font-medium">{uploadProgress}%</span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          
          <div className="text-xs text-blue-500 text-center">
            {uploadProgress < 20 && 'Compressing image...'}
            {uploadProgress >= 20 && uploadProgress < 40 && 'Preparing upload...'}
            {uploadProgress >= 40 && uploadProgress < 80 && 'Uploading to cloud...'}
            {uploadProgress >= 80 && uploadProgress < 100 && 'Processing...'}
            {uploadProgress === 100 && 'Complete!'}
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span className="text-red-600 text-sm">{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}


    </div>
  );
}
