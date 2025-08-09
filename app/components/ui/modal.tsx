"use client";
import { useState, useEffect } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: "success" | "error" | "info";
  showCloseButton?: boolean;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  message,
  type = "info",
  showCloseButton = true,
  autoClose = false,
  autoCloseDelay = 3000
}: ModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    console.log("Modal useEffect - isOpen:", isOpen, "autoClose:", autoClose);
    if (isOpen) {
      setIsVisible(true);
      if (autoClose) {
        const timer = setTimeout(() => {
          console.log("Auto-closing modal");
          onClose();
        }, autoCloseDelay);
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [isOpen, onClose, autoClose, autoCloseDelay]);

  console.log("Modal render - isOpen:", isOpen, "isVisible:", isVisible, "title:", title, "message:", message);

  if (!isOpen) {
    console.log("Modal not open, returning null");
    return null;
  }

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case "error":
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Info className="w-6 h-6 text-blue-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200";
      case "error":
        return "bg-red-50 border-red-200";
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={showCloseButton ? onClose : undefined}
      />
      
      {/* Modal */}
      <div className={`
        relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 
        transform transition-all duration-300 ease-out
        ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
        ${getBackgroundColor()}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {getIcon()}
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        
        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 whitespace-pre-wrap">{message}</p>
        </div>
        
        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className={`
              px-4 py-2 rounded-lg font-medium transition-colors
              ${type === "success" 
                ? "bg-green-600 text-white hover:bg-green-700" 
                : type === "error"
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-blue-600 text-white hover:bg-blue-700"
              }
            `}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
} 