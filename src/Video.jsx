import React from "react";
import GifAnimation from "./assets/GifAnimation.gif";
import videoSrc from "./assets/sample.mp4"; // Import your video file

const Video = ({ showVideo }) => {
  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-40">
      {showVideo ? (
        <video
          src={videoSrc}
          controls
          autoPlay
          className="w-4/5 h-4/5 object-cover"
        >
          Your browser does not support the video tag.
        </video>
      ) : (
        <img
          src={GifAnimation}
          alt="Recording Overlay"
          className="w-1/3 h-1/3"
        />
      )}
    </div>
  );
};

export default Video;
