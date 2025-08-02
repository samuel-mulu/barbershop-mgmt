"use client";
import React from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background animated elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
          <div className="shape shape-5"></div>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center">
        {/* App title */}
        <div className="mb-8">
          <h1 className="app-title">Barbershop Pro</h1>
          <p className="app-subtitle">Professional Management System</p>
        </div>

        {/* Animated loader */}
        <div className="loader-container">
          <div className="pl">
            <div className="pl__dot" />
            <div className="pl__dot" />
            <div className="pl__dot" />
            <div className="pl__dot" />
            <div className="pl__dot" />
            <div className="pl__dot" />
            <div className="pl__dot" />
            <div className="pl__dot" />
            <div className="pl__dot" />
            <div className="pl__dot" />
            <div className="pl__dot" />
            <div className="pl__dot" />
            <div className="pl__text">ፈታ</div>
          </div>
        </div>

        {/* Loading text */}
        <div className="mt-8">
          <p className="loading-text">Loading...</p>
          <div className="loading-dots">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        </div>

        {/* Color palette display */}
        <div className="mt-12 color-palette">
          <div className="color-item" style={{backgroundColor: '#667eea'}}>
            <span className="color-number">#667eea</span>
          </div>
          <div className="color-item" style={{backgroundColor: '#764ba2'}}>
            <span className="color-number">#764ba2</span>
          </div>
          <div className="color-item" style={{backgroundColor: '#10b981'}}>
            <span className="color-number">#10b981</span>
          </div>
          <div className="color-item" style={{backgroundColor: '#f59e0b'}}>
            <span className="color-number">#f59e0b</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        :root {
          --bg: #2e3138;
          --primary1: #667eea;
          --primary2: #764ba2;
          --fg-t: rgba(255, 255, 255, 0.8);
          --trans-dur: 0.3s;
        }

        /* App title styling */
        .app-title {
          font-size: 3rem;
          font-weight: 800;
          background: linear-gradient(135deg, #667eea, #764ba2, #10b981);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradientShift 3s ease-in-out infinite;
          margin: 0;
          text-shadow: 0 0 30px rgba(102, 126, 234, 0.5);
        }

        .app-subtitle {
          font-size: 1.2rem;
          color: rgba(255, 255, 255, 0.7);
          margin: 0.5rem 0 0 0;
          font-weight: 300;
          letter-spacing: 0.1em;
        }

        /* Loader container */
        .loader-container {
          display: flex;
          justify-content: center;
          align-items: center;
          margin: 2rem 0;
        }

        /* Loading text and dots */
        .loading-text {
          font-size: 1.1rem;
          color: rgba(255, 255, 255, 0.8);
          margin: 0 0 1rem 0;
          font-weight: 500;
        }

        .loading-dots {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
        }

        .loading-dots .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea, #764ba2);
          animation: dotPulse 1.5s ease-in-out infinite;
        }

        .loading-dots .dot:nth-child(2) {
          animation-delay: 0.2s;
        }

        .loading-dots .dot:nth-child(3) {
          animation-delay: 0.4s;
        }

        /* Color palette */
        .color-palette {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-top: 2rem;
        }

        .color-item {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          cursor: pointer;
        }

        .color-item:hover {
          transform: translateY(-5px) scale(1.1);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
        }

        .color-number {
          font-size: 0.7rem;
          font-weight: 600;
          color: white;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .color-item:hover .color-number {
          opacity: 1;
        }

        /* Floating background shapes */
        .floating-shapes {
          position: absolute;
          width: 100%;
          height: 100%;
        }

        .shape {
          position: absolute;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
          animation: float 6s ease-in-out infinite;
        }

        .shape-1 {
          width: 80px;
          height: 80px;
          top: 10%;
          left: 10%;
          animation-delay: 0s;
        }

        .shape-2 {
          width: 120px;
          height: 120px;
          top: 20%;
          right: 15%;
          animation-delay: 1s;
        }

        .shape-3 {
          width: 60px;
          height: 60px;
          bottom: 30%;
          left: 20%;
          animation-delay: 2s;
        }

        .shape-4 {
          width: 100px;
          height: 100px;
          bottom: 20%;
          right: 10%;
          animation-delay: 3s;
        }

        .shape-5 {
          width: 70px;
          height: 70px;
          top: 50%;
          left: 50%;
          animation-delay: 4s;
        }

        /* Animations */
        @keyframes gradientShift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        @keyframes dotPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.7;
          }
          50% {
            transform: scale(1.2);
            opacity: 1;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
            opacity: 0.6;
          }
        }

        .pl {
          box-shadow: 2em 0 2em rgba(0, 0, 0, 0.2) inset, -2em 0 2em rgba(255, 255, 255, 0.1) inset;
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          transform: rotateX(30deg) rotateZ(45deg);
          width: 14em;
          height: 14em;
          color: white;
        }

        .pl, .pl__dot {
          border-radius: 50%;
        }

        .pl__dot {
          animation-name: shadow724;
          box-shadow: 0.1em 0.1em 0 0.1em black, 0.3em 0 0.3em rgba(0, 0, 0, 0.5);
          top: calc(50% - 0.75em);
          left: calc(50% - 0.75em);
          width: 1.5em;
          height: 1.5em;
        }

        .pl__dot, .pl__dot:before, .pl__dot:after {
          animation-duration: 2s;
          animation-iteration-count: infinite;
          position: absolute;
        }

        .pl__dot:before, .pl__dot:after {
          content: "";
          display: block;
          left: 0;
          width: inherit;
          transition: background-color var(--trans-dur);
        }

        .pl__dot:before {
          animation-name: pushInOut1724;
          background-color: var(--bg);
          border-radius: inherit;
          box-shadow: 0.05em 0 0.1em rgba(255, 255, 255, 0.2) inset;
          height: inherit;
          z-index: 1;
        }

        .pl__dot:after {
          animation-name: pushInOut2724;
          background-color: var(--primary1);
          border-radius: 0.75em;
          box-shadow: 0.1em 0.3em 0.2em rgba(255, 255, 255, 0.4) inset, 0 -0.4em 0.2em #2e3138 inset, 0 -1em 0.25em rgba(0, 0, 0, 0.3) inset;
          bottom: 0;
          clip-path: polygon(0 75%, 100% 75%, 100% 100%, 0 100%);
          height: 3em;
          transform: rotate(-45deg);
          transform-origin: 50% 2.25em;
        }

        .pl__dot:nth-child(1) {
          transform: rotate(0deg) translateX(5em) rotate(0deg);
          z-index: 5;
        }

        .pl__dot:nth-child(1), .pl__dot:nth-child(1):before, .pl__dot:nth-child(1):after {
          animation-delay: 0s;
        }

        .pl__dot:nth-child(2) {
          transform: rotate(-30deg) translateX(5em) rotate(30deg);
          z-index: 4;
        }

        .pl__dot:nth-child(2), .pl__dot:nth-child(2):before, .pl__dot:nth-child(2):after {
          animation-delay: -0.1666666667s;
        }

        .pl__dot:nth-child(3) {
          transform: rotate(-60deg) translateX(5em) rotate(60deg);
          z-index: 3;
        }

        .pl__dot:nth-child(3), .pl__dot:nth-child(3):before, .pl__dot:nth-child(3):after {
          animation-delay: -0.3333333333s;
        }

        .pl__dot:nth-child(4) {
          transform: rotate(-90deg) translateX(5em) rotate(90deg);
          z-index: 2;
        }

        .pl__dot:nth-child(4), .pl__dot:nth-child(4):before, .pl__dot:nth-child(4):after {
          animation-delay: -0.5s;
        }

        .pl__dot:nth-child(5) {
          transform: rotate(-120deg) translateX(5em) rotate(120deg);
          z-index: 1;
        }

        .pl__dot:nth-child(5), .pl__dot:nth-child(5):before, .pl__dot:nth-child(5):after {
          animation-delay: -0.6666666667s;
        }

        .pl__dot:nth-child(6) {
          transform: rotate(-150deg) translateX(5em) rotate(150deg);
          z-index: 1;
        }

        .pl__dot:nth-child(6), .pl__dot:nth-child(6):before, .pl__dot:nth-child(6):after {
          animation-delay: -0.8333333333s;
        }

        .pl__dot:nth-child(7) {
          transform: rotate(-180deg) translateX(5em) rotate(180deg);
          z-index: 2;
        }

        .pl__dot:nth-child(7), .pl__dot:nth-child(7):before, .pl__dot:nth-child(7):after {
          animation-delay: -1s;
        }

        .pl__dot:nth-child(8) {
          transform: rotate(-210deg) translateX(5em) rotate(210deg);
          z-index: 3;
        }

        .pl__dot:nth-child(8), .pl__dot:nth-child(8):before, .pl__dot:nth-child(8):after {
          animation-delay: -1.1666666667s;
        }

        .pl__dot:nth-child(9) {
          transform: rotate(-240deg) translateX(5em) rotate(240deg);
          z-index: 4;
        }

        .pl__dot:nth-child(9), .pl__dot:nth-child(9):before, .pl__dot:nth-child(9):after {
          animation-delay: -1.3333333333s;
        }

        .pl__dot:nth-child(10) {
          transform: rotate(-270deg) translateX(5em) rotate(270deg);
          z-index: 5;
        }

        .pl__dot:nth-child(10), .pl__dot:nth-child(10):before, .pl__dot:nth-child(10):after {
          animation-delay: -1.5s;
        }

        .pl__dot:nth-child(11) {
          transform: rotate(-300deg) translateX(5em) rotate(300deg);
          z-index: 6;
        }

        .pl__dot:nth-child(11), .pl__dot:nth-child(11):before, .pl__dot:nth-child(11):after {
          animation-delay: -1.6666666667s;
        }

        .pl__dot:nth-child(12) {
          transform: rotate(-330deg) translateX(5em) rotate(330deg);
          z-index: 6;
        }

        .pl__dot:nth-child(12), .pl__dot:nth-child(12):before, .pl__dot:nth-child(12):after {
          animation-delay: -1.8333333333s;
        }

        .pl__text {
          font-size: 0.75em;
          max-width: 5rem;
          position: relative;
          text-shadow: 0 0 0.1em var(--fg-t);
          transform: rotateZ(-45deg);
        }

        /* Animations */
        @keyframes shadow724 {
          from {
            animation-timing-function: ease-in;
            box-shadow: 0.1em 0.1em 0 0.1em black, 0.3em 0 0.3em rgba(0, 0, 0, 0.3);
          }

          25% {
            animation-timing-function: ease-out;
            box-shadow: 0.1em 0.1em 0 0.1em black, 0.8em 0 0.8em rgba(0, 0, 0, 0.5);
          }

          50%, to {
            box-shadow: 0.1em 0.1em 0 0.1em black, 0.3em 0 0.3em rgba(0, 0, 0, 0.3);
          }
        }

        @keyframes pushInOut1724 {
          from {
            animation-timing-function: ease-in;
            background-color: var(--bg);
            transform: translate(0, 0);
          }

          25% {
            animation-timing-function: ease-out;
            background-color: var(--primary2);
            transform: translate(-71%, -71%);
          }

          50%, to {
            background-color: var(--bg);
            transform: translate(0, 0);
          }
        }

        @keyframes pushInOut2724 {
          from {
            animation-timing-function: ease-in;
            background-color: var(--bg);
            clip-path: polygon(0 75%, 100% 75%, 100% 100%, 0 100%);
          }

          25% {
            animation-timing-function: ease-out;
            background-color: var(--primary1);
            clip-path: polygon(0 25%, 100% 25%, 100% 100%, 0 100%);
          }

          50%, to {
            background-color: var(--bg);
            clip-path: polygon(0 75%, 100% 75%, 100% 100%, 0 100%);
          }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen; 