"use client";

import { useRef, useState } from "react";

export function CustomVideo({ vidAddress }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Play/Pause toggle
  const handlePlayPause = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  // Mute/Unmute toggle
  const handleMuteToggle = () => {
    if (!videoRef.current) return;

    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(!isMuted);
  };

  return (
    <div className="max-w-4xl">
      <video
        ref={videoRef}
        src={vidAddress}
        loop
        playsInline
        autoPlay
        muted={isMuted} // starts muted by default
      />

      {/* Big overlay button for the first play */}
      {!isPlaying && (
        <button
          onClick={handlePlayPause}
          className="
              absolute top-1/2 left-1/2
              -translate-x-1/2 -translate-y-1/2
              bg-gray-900 text-white text-4xl
              py-2 px-4 rounded-full opacity-80
              hover:opacity-100
            "
        >
          ▶
        </button>
      )}

      {/* Once playing, show Mute/Unmute and Pause buttons */}
      {isPlaying && (
        <>
          <button
            onClick={handleMuteToggle}
            className="
                absolute bottom-4 right-4
                bg-gray-900 text-white text-sm
                py-1 px-2 rounded
                hover:opacity-80
              "
          >
            {isMuted ? "Unmute" : "Mute"}
          </button>

          <button
            onClick={handlePlayPause}
            className="
                absolute bottom-4 left-4
                bg-gray-900 text-white text-sm
                py-1 px-2 rounded
                hover:opacity-80
              "
          >
            {isPlaying ? "Pause" : "Play"}
          </button>
        </>
      )}
    </div>
  );
}

export default CustomVideo;
