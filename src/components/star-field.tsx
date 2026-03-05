"use client";
import React, { useMemo } from "react";

export function StarField() {
  const stars = useMemo(() => {
    return Array.from({ length: 120 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 0.5,
      duration: Math.random() * 4 + 2,
      delay: Math.random() * 5,
      opacity: Math.random() * 0.5 + 0.2,
    }));
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Ambient glow orbs */}
      <div className="glow-orb absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-blue-600/10" />
      <div
        className="glow-orb absolute bottom-1/3 -right-32 w-80 h-80 rounded-full bg-emerald-500/8"
        style={{ animationDelay: "3s" }}
      />
      <div
        className="glow-orb absolute top-2/3 left-1/3 w-64 h-64 rounded-full bg-purple-500/5"
        style={{ animationDelay: "1.5s" }}
      />

      {/* Stars */}
      {stars.map((star) => (
        <div
          key={star.id}
          className="star absolute rounded-full bg-white"
          style={{
            left: star.left,
            top: star.top,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
            ["--twinkle-duration" as string]: `${star.duration}s`,
            ["--twinkle-delay" as string]: `${star.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
