const fs = require('fs');
let content = fs.readFileSync('components/views/HomeView.tsx', 'utf8');

// Add useRef
if (!content.includes('import React, { useState, useEffect, useRef }')) {
  content = content.replace(
    "import React, { useState, useEffect } from 'react';",
    "import React, { useState, useEffect, useRef } from 'react';"
  );
}

// Remove old state
const oldStateSearch = `  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);`;

const newRefReplace = `  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);`;

content = content.replace(oldStateSearch, newRefReplace);

// Update handlers
const oldHandlersSearch = `  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    if (isLeftSwipe) {
      nextSlide();
    }
    if (isRightSwipe) {
      prevSlide();
    }
    setTouchStart(null);
    setTouchEnd(null);
  };`;

const newHandlersReplace = `  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      const totalPages = Math.ceil(testimonials.length / itemsPerPage);
      if (diff > 0) setCurrentIndex(i => Math.min(i + 1, totalPages - 1));
      else          setCurrentIndex(i => Math.max(i - 1, 0));
    }
  };`;

content = content.replace(oldHandlersSearch, newHandlersReplace);

fs.writeFileSync('components/views/HomeView.tsx', content);
