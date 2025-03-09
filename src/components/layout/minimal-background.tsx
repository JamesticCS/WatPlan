"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

export const MinimalInteractiveBackground = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const animationRef = useRef<number>();
  const pointsRef = useRef<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    opacity: number;
    hue: number;
  }>>([]);

  // Initialize canvas and points
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        const width = window.innerWidth;
        const height = Math.max(window.innerHeight, document.body.scrollHeight);
        
        setDimensions({
          width,
          height,
        });
        
        // Reinitialize points when dimensions change significantly
        initializePoints(width, height);
      }
    };
    
    const initializePoints = (width: number, height: number) => {
      const pointCount = Math.min(
        Math.max(Math.floor((width * height) / 25000), 15), 
        40
      );
      
      pointsRef.current = Array.from({ length: pointCount }, () => ({
        x: Math.random() * (width || 1000),
        y: Math.random() * (height || 800),
        vx: (Math.random() - 0.5) * 0.7,
        vy: (Math.random() - 0.5) * 0.7,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.3 + 0.1,
        hue: Math.random() * 60 + 40, // Gold/amber range
      }));
    };

    // Set initial dimensions and points
    handleResize();

    // Add resize listener with debounce
    let resizeTimer: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(handleResize, 100);
    };
    
    window.addEventListener('resize', debouncedResize);
    
    // Also check document height periodically to handle dynamic content
    const heightCheckInterval = setInterval(() => {
      if (typeof document !== 'undefined') {
        const docHeight = Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight
        );
        
        if (docHeight > dimensions.height) {
          setDimensions(prev => ({
            ...prev,
            height: docHeight
          }));
        }
      }
    }, 1000);

    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearInterval(heightCheckInterval);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Throttled mouse move handler
  useEffect(() => {
    let lastMoveTime = 0;
    const THROTTLE_MS = 16; // ~60fps
    
    const handleMouseMove = (e: MouseEvent) => {
      const now = performance.now();
      if (now - lastMoveTime < THROTTLE_MS) return;
      
      lastMoveTime = now;
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Animation loop
  useEffect(() => {
    if (!canvasRef.current || dimensions.width === 0) return;

    // Make sure canvas dimensions match current dimensions
    if (canvasRef.current.width !== dimensions.width || 
        canvasRef.current.height !== dimensions.height) {
      canvasRef.current.width = dimensions.width;
      canvasRef.current.height = dimensions.height;
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const drawLines = (ctx: CanvasRenderingContext2D) => {
      const points = pointsRef.current;
      
      // Clear canvas
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);
      
      // Update and draw points
      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        
        // Apply very slight attraction to mouse
        const dx = mousePosition.x - point.x;
        const dy = mousePosition.y - point.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 200) {
          // Very subtle attraction
          point.vx += (dx / dist) * 0.03;
          point.vy += (dy / dist) * 0.03;
        }
        
        // Apply small damping
        point.vx *= 0.99;
        point.vy *= 0.99;
        
        // Update position
        point.x += point.vx;
        point.y += point.vy;
        
        // Wrap around screen edges
        if (point.x < 0) point.x = dimensions.width;
        if (point.x > dimensions.width) point.x = 0;
        if (point.y < 0) point.y = dimensions.height;
        if (point.y > dimensions.height) point.y = 0;
        
        // Draw point
        ctx.beginPath();
        ctx.arc(point.x, point.y, point.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${point.hue}, 90%, 70%, ${point.opacity})`;
        ctx.fill();
      }
      
      // Draw connections between nearby points
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.06)'; // Very subtle gold
      ctx.lineWidth = 0.5;
      
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const dx = points[i].x - points[j].x;
          const dy = points[i].y - points[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 150) {
            ctx.beginPath();
            ctx.moveTo(points[i].x, points[i].y);
            ctx.lineTo(points[j].x, points[j].y);
            const opacity = (1 - distance / 150) * 0.15;
            ctx.strokeStyle = `rgba(255, 215, 0, ${opacity})`;
            ctx.stroke();
          }
        }
      }
      
      // Draw connections to mouse if nearby
      if (mousePosition.x > 0 && mousePosition.y > 0) {
        for (let i = 0; i < points.length; i++) {
          const dx = points[i].x - mousePosition.x;
          const dy = points[i].y - mousePosition.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 200) {
            ctx.beginPath();
            ctx.moveTo(points[i].x, points[i].y);
            ctx.lineTo(mousePosition.x, mousePosition.y);
            const opacity = (1 - distance / 200) * 0.2;
            ctx.strokeStyle = `rgba(255, 215, 0, ${opacity})`;
            ctx.stroke();
          }
        }
      }
    };

    const animate = () => {
      drawLines(ctx);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [dimensions, mousePosition]);

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none bg-gradient-to-b from-slate-50 to-amber-50 dark:from-slate-950 dark:to-amber-950 z-0 min-h-screen">
      {/* Subtle gradient overlay */}
      <div className="fixed inset-0 w-full h-full bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-primary/5"></div>
      
      {/* Canvas for drawing */}
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="fixed inset-0 w-full h-full"
      />
      
      {/* Subtle glow in the center */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vh] rounded-full bg-primary/10 dark:bg-primary/5 blur-3xl"></div>
      
      {/* Extra div to ensure background color extends beyond scroll */}
      <div className="fixed -inset-[100vw] bg-gradient-to-b from-slate-50 to-amber-50 dark:from-slate-950 dark:to-amber-950 -z-10"></div>
    </div>
  );
};