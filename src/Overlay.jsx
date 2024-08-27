import React from "react";
import GifAnimation from "./assets/GifAnimation.gif";

const Overlay = () => {
  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-40 ">
      <img src={GifAnimation} alt="Recording Overlay" className="w-1/3 h-1/3" />
    </div>
  );
};

export default Overlay;
