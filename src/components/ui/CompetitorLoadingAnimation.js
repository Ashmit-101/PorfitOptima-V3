import React, { useState, useEffect } from 'react';
import SpiralAnimation from './SpiralAnimation';

const CompetitorLoadingAnimation = ({ onComplete }) => {
  const messages = [
    "Locating competitors...",
    "Sneaking into store...",
    "Looking at all the prices...",
    "Gaining insights...",
    "Calculating optimal price..."
  ];

  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [messageVisible, setMessageVisible] = useState(false);

  useEffect(() => {
    // Fade in first message after brief delay
    const initialDelay = setTimeout(() => {
      setMessageVisible(true);
    }, 300);

    return () => clearTimeout(initialDelay);
  }, []);

  useEffect(() => {
    if (currentMessageIndex >= messages.length) {
      // Animation complete - fade out entire component
      const fadeOutTimer = setTimeout(() => {
        setIsVisible(false);
      }, 1000);

      const completeTimer = setTimeout(() => {
        if (onComplete) onComplete();
      }, 1500);

      return () => {
        clearTimeout(fadeOutTimer);
        clearTimeout(completeTimer);
      };
    }

    // Fade out current message
    const fadeOutTimer = setTimeout(() => {
      setMessageVisible(false);
    }, 2500); // Show for 2.5 seconds

    // Move to next message
    const nextMessageTimer = setTimeout(() => {
      setCurrentMessageIndex((prev) => prev + 1);
      setMessageVisible(true);
    }, 3500); // Total cycle: 3.5 seconds (2.5s visible + 1s transition)

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(nextMessageTimer);
    };
  }, [currentMessageIndex, messages.length, onComplete]);

  if (!isVisible) return null;

  return (
    <div className={`competitor-loading-overlay ${!isVisible ? 'fade-out' : ''}`}>
      <div className="spiral-background">
        <SpiralAnimation />
      </div>

      <div className="loading-message-container">
        {currentMessageIndex < messages.length && (
          <div className={`loading-message ${messageVisible ? 'visible' : ''}`}>
            {messages[currentMessageIndex]}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompetitorLoadingAnimation;
