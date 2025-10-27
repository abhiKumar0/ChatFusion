"use client";

import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eraser, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCallStore } from '@/store/useCallStore';
import { useSocket } from '@/lib/socket-provider';

interface DrawPoint {
  x: number;
  y: number;
  color: string;
  size: number;
}

export function Whiteboard() {
  const socket = useSocket();
  const { isWhiteboardOpen, setIsWhiteboardOpen, remoteUser } = useCallStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#FFFFFF');
  const [brushSize, setBrushSize] = useState(3);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const colors = ['#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];

  useEffect(() => {
    if (!socket) return;

    socket.on('whiteboard_draw', ({ from, to, color, size }: { from: DrawPoint; to: DrawPoint; color: string; size: number }) => {
      drawLine(from, to, color, size);
    });

    socket.on('whiteboard_clear', () => {
      clearCanvas();
    });

    return () => {
      socket.off('whiteboard_draw');
      socket.off('whiteboard_clear');
    };
  }, [socket]);

  const drawLine = (from: { x: number; y: number }, to: { x: number; y: number }, lineColor: string, size: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = lineColor;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      lastPointRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPointRef.current) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const currentPoint = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    drawLine(lastPointRef.current, currentPoint, color, brushSize);

    if (socket && remoteUser) {
      socket.emit('whiteboard_draw', {
        targetUserId: remoteUser.id,
        from: lastPointRef.current,
        to: currentPoint,
        color,
        size: brushSize,
      });
    }

    lastPointRef.current = currentPoint;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPointRef.current = null;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleClear = () => {
    clearCanvas();
    if (socket && remoteUser) {
      socket.emit('whiteboard_clear', {
        targetUserId: remoteUser.id,
      });
    }
  };

  if (!isWhiteboardOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="absolute inset-4 bg-gray-900/95 backdrop-blur-xl rounded-lg border border-gray-700 flex flex-col z-50"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-white font-semibold">Whiteboard</h3>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleClear}
              className="text-white hover:bg-gray-800"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsWhiteboardOpen(false)}
              className="text-white hover:bg-gray-800"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Tools */}
        <div className="flex items-center gap-4 p-4 border-b border-gray-700">
          <div className="flex gap-2">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full border-2 ${
                  color === c ? 'border-white scale-110' : 'border-gray-600'
                } transition-transform`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-white text-sm">Size:</span>
            {[2, 4, 8, 12].map((size) => (
              <button
                key={size}
                onClick={() => setBrushSize(size)}
                className={`w-8 h-8 rounded border-2 flex items-center justify-center ${
                  brushSize === size ? 'border-white bg-gray-700' : 'border-gray-600'
                }`}
              >
                <div
                  className="rounded-full bg-white"
                  style={{ width: size, height: size }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 p-4 overflow-hidden">
          <canvas
            ref={canvasRef}
            width={1200}
            height={800}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="w-full h-full bg-gray-800 rounded cursor-crosshair"
            style={{ touchAction: 'none' }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
