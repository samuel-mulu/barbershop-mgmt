"use client";
import { X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { useState } from 'react';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title?: string;
}

export default function ImageModal({ isOpen, onClose, imageUrl, title = "Payment Proof" }: ImageModalProps) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  console.log("🔍 ImageModal props:", { isOpen, imageUrl, title });

  if (!isOpen) {
    console.log("🔍 ImageModal: Not open, returning null");
    return null;
  }
  
  console.log("🔍 ImageModal: Rendering modal with image URL:", imageUrl);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleReset = () => {
    setScale(1);
    setRotation(0);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[99999] p-4" style={{ zIndex: 99999 }}>
      <div className="bg-white rounded-2xl shadow-2xl border-0 w-full max-w-4xl max-h-[90vh] animate-slideIn">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-white rounded-t-2xl flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <div className="flex items-center space-x-2">
            {/* Zoom Controls */}
            <button
              onClick={handleZoomOut}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-500 min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            
            {/* Rotate Button */}
            <button
              onClick={handleRotate}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Rotate"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            
            {/* Reset Button */}
            <button
              onClick={handleReset}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Reset
            </button>
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-8 h-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors bg-white rounded-full border border-gray-200 flex items-center justify-center text-lg font-bold"
            >
              ×
            </button>
          </div>
        </div>
        
        {/* Modal Content */}
        <div className="p-6 bg-white rounded-b-2xl overflow-auto max-h-[calc(90vh-120px)]">
          <div className="flex justify-center">
            <div 
              className="relative overflow-auto border border-gray-200 rounded-lg bg-gray-50"
              style={{ 
                maxWidth: '100%', 
                maxHeight: 'calc(90vh - 200px)',
                minHeight: '200px'
              }}
            >
                             <img
                 src={imageUrl}
                 alt="Payment proof"
                 className="block"
                 style={{
                   transform: `scale(${scale}) rotate(${rotation}deg)`,
                   transformOrigin: 'center',
                   transition: 'transform 0.2s ease-in-out'
                 }}
                 onError={(e) => {
                   console.error("🔍 Image failed to load:", imageUrl);
                   e.currentTarget.style.display = 'none';
                 }}
                 onLoad={() => {
                   console.log("🔍 Image loaded successfully:", imageUrl);
                 }}
               />
            </div>
          </div>
          
                     {/* Image Info */}
           <div className="mt-4 text-center">
             <p className="text-sm text-gray-600">
               Click and drag to pan, use controls to zoom and rotate
             </p>
             <p className="text-xs text-gray-500 mt-1">
               Image URL: {imageUrl}
             </p>
             <a 
               href={imageUrl} 
               target="_blank" 
               rel="noopener noreferrer"
               className="inline-block mt-2 text-blue-600 hover:text-blue-800 text-sm underline"
             >
               Open in new tab
             </a>
           </div>
        </div>
      </div>
    </div>
  );
}
