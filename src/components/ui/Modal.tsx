"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export default function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        style={{ animation: "fadeIn 0.2s ease" }}
      />
      <div
        className={cn(
          "relative glass w-full max-w-lg p-6 z-10",
          className
        )}
        style={{ animation: "zoomIn 0.25s ease" }}
      >
        <div className="flex items-center justify-between mb-6">
          {title && (
            <h3 style={{ fontFamily: "var(--font-playfair)" }} className="text-xl font-bold text-[--gold]">
              {title}
            </h3>
          )}
          <button
            onClick={onClose}
            className="ml-auto p-2 rounded-full hover:bg-white/10 text-[--muted] hover:text-[--text] transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
