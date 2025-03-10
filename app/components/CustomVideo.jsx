'use client';

import { useRef, useState } from "react";
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';

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
      <div className="tw-relative tw-w-full tw-h-auto tw-mb-10">
        <video
          ref={videoRef}
          src={vidAddress}
          loop
          muted={isMuted} // starts muted by default
          className="tw-w-full tw-h-auto"
        />
  
        {/* Big overlay button for the first play */}
        {!isPlaying && (
          <button
            onClick={handlePlayPause}
            className="
              tw-absolute tw-top-1/2 tw-left-1/2
              tw--translate-x-1/2 tw--translate-y-1/2
              tw-bg-gray-900 tw-text-white tw-text-4xl
              tw-py-2 tw-px-4 tw-rounded-full tw-opacity-80
              hover:tw-opacity-100
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
                tw-absolute tw-bottom-4 tw-right-4
                tw-bg-gray-900 tw-text-white tw-text-sm
                tw-py-1 tw-px-2 tw-rounded
                hover:tw-opacity-80
              "
            >
              {isMuted ? "Unmute" : "Mute"}
            </button>
  
            <button
              onClick={handlePlayPause}
              className="
                tw-absolute tw-bottom-4 tw-left-4
                tw-bg-gray-900 tw-text-white tw-text-sm
                tw-py-1 tw-px-2 tw-rounded
                hover:tw-opacity-80
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