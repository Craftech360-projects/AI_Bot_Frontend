// import React, { useState, useEffect, useRef } from "react";
// import "./App.css";
// import searchIcon from "./assets/search-icon.png";
// import micIcon from "./assets/mic.png";
// import stopIcon from "./assets/icons8-stop-100.png";
// import Overlay from "./Overlay.jsx";
// import backgroundImage from "./assets/backgroundimage.png";

// const BASE_URL = "http://localhost:5000";
// const DEEPGRAM_API_KEY = "ab763c7874734209d21d838a62804b8119175f0c"; // Replace with your actual API key

// function App() {
//   const [messages, setMessages] = useState([]);
//   const [inputValue, setInputValue] = useState("");
//   const [isRecording, setIsRecording] = useState(false);
//   const [mediaRecorder, setMediaRecorder] = useState(null);
//   const [audioChunks, setAudioChunks] = useState([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [audioPlaying, setAudioPlaying] = useState(false);
//   const [isFullscreen, setFullscreen] = useState(false);
//   const [currentPage, setCurrentPage] = useState(0);
//   const questionsPerPage = 6;

//   const audioRef = useRef(null);
//   const appRef = useRef(null);
//   const maxRecordingTime = 10000;
//   const mediaRecorderRef = useRef(null);

//   const presetQuestions = [
//     "AI INSTITUTE",
//     "AI LEAP",
//     "AI ENABLE",
//     "AI CONSORTIUM",
//     "About Deloitte",
//     "Deloitte Gen AI COE Capabilities",
//     "Why it Gen AI Matters?",
//     "Share Gen AI Facts with us",
//     "AI Research Lab",
//   ];
//   const displayedQuestions2 = [
//     "Value Levers We Enable for our Clients using Gen AI",
//     "Deloitte Gen AI COE Capabilities",
//   ];

//   const toggleFullScreen = () => {
//     if (!document.fullscreenElement) {
//       document.documentElement.requestFullscreen();
//       setFullscreen(true);
//       console.log(isFullscreen);
//     } else {
//       if (document.exitFullscreen) {
//         document.exitFullscreen();
//         setFullscreen(false);
//         console.log(isFullscreen);
//       }
//     }
//   };

//   useEffect(() => {
//     const chatMessages = document.getElementById("chat-messages");
//     if (chatMessages) {
//       chatMessages.scrollTop = chatMessages.scrollHeight;
//     }
//   }, [messages]);

//   async function sendMessage(inputValue) {
//     const message = inputValue.trim();

//     if (message) {
//       if (audioRef.current) {
//         audioRef.current.pause();
//         audioRef.current = null;
//         setAudioPlaying(false);
//       }

//       appendMessage("user", message);
//       setIsLoading(true);

//       try {
//         const response = await fetch(`${BASE_URL}/chat`, {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({ message: message }),
//         });

//         if (!response.ok) {
//           throw new Error("Network response was not ok");
//         }

//         const reader = response.body.getReader();
//         const decoder = new TextDecoder();

//         while (true) {
//           const { done, value } = await reader.read();
//           if (done) break;

//           const chunk = decoder.decode(value, { stream: true });

//           if (chunk.startsWith("{")) {
//             const data = JSON.parse(chunk);
//             appendMessage("bot", data.response);
//           } else if (chunk.includes("--audio")) {
//             const audioBlob = await readAudioData(reader);
//             playAudio(audioBlob);
//           }
//         }
//       } catch (error) {
//         console.error("Error:", error);
//         appendMessage("bot", "There was an error processing your request.");
//       } finally {
//         setIsLoading(false);
//         setInputValue("");
//       }
//     }
//   }

//   async function readAudioData(reader) {
//     const chunks = [];
//     const decoder = new TextDecoder();
//     while (true) {
//       const { done, value } = await reader.read();
//       if (done) break;
//       const text = decoder.decode(value, { stream: true });
//       if (text.includes("--audio--")) {
//         break;
//       }
//       chunks.push(value);
//     }
//     return new Blob(chunks, { type: "audio/mpeg" });
//   }

//   function playAudio(audioBlob) {
//     const audioUrl = URL.createObjectURL(audioBlob);
//     const audio = new Audio(audioUrl);
//     audioRef.current = audio;
//     setAudioPlaying(true);
//     audio.play();

//     audio.addEventListener("ended", () => {
//       setAudioPlaying(false);
//     });
//   }

//   const appendMessage = (sender, message) => {
//     setMessages((prevMessages) => [...prevMessages, { sender, message }]);
//   };

//   const toggleRecording = async () => {
//     console.log("toggle");
//     if (!isRecording) {
//       try {
//         const stream = await navigator.mediaDevices.getUserMedia({
//           audio: true,
//         });
//         const recorder = new MediaRecorder(stream);
//         mediaRecorderRef.current = recorder;
//         setMediaRecorder(recorder);

//         let chunks = [];

//         recorder.addEventListener("dataavailable", (event) => {
//           if (event.data.size > 0) {
//             chunks.push(event.data);
//           }
//         });

//         recorder.addEventListener("stop", () => {
//           const audioBlob = new Blob(chunks, { type: "audio/webm" });
//           sendAudioToDeepgram(audioBlob);
//         });

//         recorder.start();
//         setIsRecording(true);
//         console.log("time start");
//         setTimeout(() => {
//           console.log("timeout");
//           stopRecording();
//         }, maxRecordingTime);
//       } catch (error) {
//         console.error("Error accessing microphone:", error);
//       }
//     } else {
//       stopRecording();
//     }
//   };

//   const stopRecording = () => {
//     console.log("stopping");
//     if (
//       mediaRecorderRef.current &&
//       mediaRecorderRef.current.state === "recording"
//     ) {
//       mediaRecorderRef.current.stop();
//       setIsRecording(false);
//     } else {
//       console.log("no recorder or not recording", mediaRecorderRef.current);
//     }
//   };

//   const sendAudioToDeepgram = async (audioBlob) => {
//     console.log("Sending audioBlob:", audioBlob);
//     const url =
//       "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true";

//     try {
//       const response = await fetch(url, {
//         method: "POST",
//         headers: {
//           Authorization: `Token ${DEEPGRAM_API_KEY}`,
//           "Content-Type": "audio/webm",
//         },
//         body: audioBlob,
//       });

//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const data = await response.json();
//       processTranscription(data);
//     } catch (error) {
//       console.error("Error sending audio to Deepgram API:", error);
//       alert("Error processing audio. Please try again.");
//     }
//   };

//   const processTranscription = (data) => {
//     if (
//       data &&
//       data.results &&
//       data.results.channels &&
//       data.results.channels[0].alternatives
//     ) {
//       const transcript = data.results.channels[0].alternatives[0].transcript;
//       setInputValue(transcript);
//       sendMessage(transcript);
//     } else {
//       alert("No transcription available. Please try again.");
//     }
//   };

//   function handleKeyDown(event) {
//     if (event.key === "Enter") {
//       event.preventDefault(); // Prevent the default action of form submission
//       sendMessage(inputValue);
//     }
//   }

//   return (
//     <div
//       className=" h-screen bg-cover bg-center bg-no-repeat flex flex-col items-center justify-center  "
//       style={{ backgroundImage: `url(${backgroundImage})` }}
//     >
//       {" "}
//       {!isFullscreen ? (
//         <button
//           className="absolute top-4 right-4 p-2  rounded-md transition-opacity duration-300 hover:opacity-100"
//           onClick={toggleFullScreen}
//         >
//           F
//         </button>
//       ) : (
//         <button
//           className="absolute top-4 right-4 p-2 bg-red-600 text-white rounded-md opacity-0 transition-opacity duration-300 hover:opacity-100"
//           onClick={toggleFullScreen}
//         >
//           x
//         </button>
//       )}
//       <div className="flex h-14 items-center bg-gradient-to-r from-[#ffffff74] to-[#d0d0d009] bg-opacity-10 rounded-2xl w-full max-w-5xl mb-24  border z-50 ">
//         <img src={searchIcon} alt="Search" className="w-6 h-6 mx-2" />
//         <input
//           type="text"
//           value={inputValue}
//           onChange={(e) => setInputValue(e.target.value)}
//           onKeyDown={handleKeyDown}
//           placeholder="Search"
//           className="flex-grow bg-transparent border-none text-white placeholder-white focus:outline-none"
//         />
//         <span
//           onClick={toggleRecording}
//           disabled={isLoading}
//           className="text-cyan-400  items-center  cursor-pointer"
//         >
//           {isRecording ? (
//             <div className="  bg-gradient-to-r from-[#ffffff74] to-[#d0d0d009] w-14 h-14 flex justify-center items-center border-2 border-white rounded-2xl ">
//               <img src={stopIcon} alt="Search" className="w-6 h-6" />
//             </div>
//           ) : (
//             <div className="  bg-gradient-to-r from-[#ffffff74] to-[#d0d0d009] w-14 h-14 flex justify-center items-center border-2 border-white rounded-2xl ">
//               <img src={micIcon} alt="Search" className="w-6 h-6" />
//             </div>
//           )}
//         </span>
//       </div>
//       {/* {!isFullscreen ? (
//         <button
//           onClick={toggleFullScreen}
//           className="text-white mt-5 top-2 right-2 w-10 h-10 opacity-0 cursor-pointer z-50"
//           aria-label="Toggle Fullscreen"
//         >
//           Full Screen
//         </button>
//       ) : (
//         <></>
//       )} */}
//       <div className="flex flex-col bg-gray-100 bg-opacity-10 items-center justify-center w-full max-w-6xl p-10 border rounded-md shadow-glow transition">
//         {isRecording && <Overlay />}
//         <div className="flex items-center justify-center w-full max-w-6xl">
//           <div className="grid grid-cols-3 gap-4 w-full">
//             {presetQuestions.map((question, index) => (
//               <button
//                 key={index}
//                 onClick={() => sendMessage(question)}
//                 disabled={isLoading}
//                 className="bg-gradient-to-r from-[#ff85e153] to-[#00eeff3e] bg-cover bg-center items-center text-center bg-no-repeat bg-opacity-10 rounded-sm p-4 text-cyan-400 hover:bg-cyan-400 hover:bg-opacity-20 hover:shadow-glow transition duration-300"
//               >
//                 {question}
//               </button>
//             ))}
//           </div>
//         </div>

//         <div className="grid grid-cols-2 gap-4 w-full mt-6">
//           {displayedQuestions2.map((question, index) => (
//             <button
//               key={index}
//               onClick={() => sendMessage(question)}
//               disabled={isLoading}
//               className="bg-gradient-to-br from-[#ff85e153] to-[#00eeff3e] bg-cover bg-center text-center bg-no-repeat items-center bg-opacity-10 rounded-md p-4  text-cyan-400 hover:bg-cyan-400 hover:bg-opacity-20 hover:shadow-glow transition duration-300"
//             >
//               {question}
//             </button>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }

// export default App;

import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import searchIcon from "./assets/search-icon.png";
import micIcon from "./assets/mic.png";
import stopIcon from "./assets/icons8-stop-100.png";
import Overlay from "./Overlay.jsx";
import backgroundImage from "./assets/backgroundimage.png";

const BASE_URL = "http://localhost:5000";
const DEEPGRAM_API_KEY = "ab763c7874734209d21d838a62804b8119175f0c"; // Replace with your actual API key

function App() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [isFullscreen, setFullscreen] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const audioRef = useRef(null);
  const appRef = useRef(null);
  const maxRecordingTime = 10000;
  const mediaRecorderRef = useRef(null);

  const presetQuestions = [
    "AI INSTITUTE",
    "AI LEAP",
    "AI ENABLE",
    "AI CONSORTIUM",
    "About Deloitte",
    "Deloitte Gen AI COE Capabilities",
    "Why it Gen AI Matters?",
    "Share Gen AI Facts with us",
    "AI Research Lab",
  ];
  const displayedQuestions2 = [
    "Value Levers We Enable for our Clients using Gen AI",
    "Deloitte Gen AI COE Capabilities",
  ];

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setFullscreen(true);
      console.log(isFullscreen);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setFullscreen(false);
        console.log(isFullscreen);
      }
    }
  };

  useEffect(() => {
    const chatMessages = document.getElementById("chat-messages");
    if (chatMessages) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }, [messages]);

  async function sendMessage(inputValue) {
    const message = inputValue.trim();

    if (message) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
        setAudioPlaying(false);
      }

      appendMessage("user", message);
      setIsLoading(true);
      setInputValue("");

      try {
        const response = await fetch(`${BASE_URL}/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: message }),
        });

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });

          if (chunk.startsWith("{")) {
            const data = JSON.parse(chunk);
            appendMessage("bot", data.response);
          } else if (chunk.includes("--audio")) {
            const audioBlob = await readAudioData(reader);
            playAudio(audioBlob);
          }
        }
      } catch (error) {
        console.error("Error:", error);
        appendMessage("bot", "There was an error processing your request.");
      } finally {
        setIsLoading(false);
        setInputValue("");
      }
    }
  }

  async function readAudioData(reader) {
    const chunks = [];
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value, { stream: true });
      if (text.includes("--audio--")) {
        break;
      }
      chunks.push(value);
    }
    return new Blob(chunks, { type: "audio/mpeg" });
  }

  function playAudio(audioBlob) {
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    setAudioPlaying(true);
    audio.play();

    audio.addEventListener("ended", () => {
      setAudioPlaying(false);
    });
  }

  const appendMessage = (sender, message) => {
    setMessages((prevMessages) => [...prevMessages, { sender, message }]);
  };

  const toggleRecording = async () => {
    console.log("toggle");
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        setMediaRecorder(recorder);

        let chunks = [];

        recorder.addEventListener("dataavailable", (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        });

        recorder.addEventListener("stop", () => {
          const audioBlob = new Blob(chunks, { type: "audio/webm" });
          sendAudioToDeepgram(audioBlob);
        });

        recorder.start();
        setIsRecording(true);
        console.log("time start");
        setTimeout(() => {
          console.log("timeout");
          stopRecording();
        }, maxRecordingTime);
      } catch (error) {
        console.error("Error accessing microphone:", error);
      }
    } else {
      stopRecording();
    }
  };

  const stopRecording = () => {
    console.log("stopping");
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    } else {
      console.log("no recorder or not recording", mediaRecorderRef.current);
    }
  };

  const sendAudioToDeepgram = async (audioBlob) => {
    console.log("Sending audioBlob:", audioBlob);
    const url =
      "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true";

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Token ${DEEPGRAM_API_KEY}`,
          "Content-Type": "audio/webm",
        },
        body: audioBlob,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      processTranscription(data);
    } catch (error) {
      console.error("Error sending audio to Deepgram API:", error);
      alert("Error processing audio. Please try again.");
    }
  };

  const processTranscription = (data) => {
    if (
      data &&
      data.results &&
      data.results.channels &&
      data.results.channels[0].alternatives
    ) {
      const transcript = data.results.channels[0].alternatives[0].transcript;
      setInputValue(transcript);
      sendMessage(transcript);
    } else {
      alert("No transcription available. Please try again.");
    }
  };

  function handleKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault(); // Prevent the default action of form submission
      sendMessage(inputValue);
    }
  }

  return (
    <div
      className=" h-screen bg-cover bg-center bg-no-repeat flex flex-col items-center justify-center  "
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      {" "}
      {!isFullscreen ? (
        <button
          className="absolute top-4 right-4 p-2  rounded-md transition-opacity duration-300 hover:opacity-100"
          onClick={toggleFullScreen}
        >
          F
        </button>
      ) : (
        <button
          className="absolute top-4 right-4 p-2 bg-red-600 text-white rounded-md opacity-0 transition-opacity duration-300 hover:opacity-100"
          onClick={toggleFullScreen}
        >
          x
        </button>
      )}
      <div className="flex h-14 items-center bg-gradient-to-r from-[#ffffff74] to-[#d0d0d009] bg-opacity-10 rounded-2xl w-full max-w-5xl mb-24  border z-50 ">
        <img src={searchIcon} alt="Search" className="w-6 h-6 mx-2" />
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          placeholder={!isLoading ? "Search" : "Loading..."}
          className="flex-grow bg-transparent border-none text-white placeholder-white focus:outline-none"
        />
        <span
          onClick={toggleRecording}
          disabled={isLoading}
          className="text-cyan-400  items-center  cursor-pointer"
        >
          {isRecording ? (
            <div className="  bg-gradient-to-r from-[#ffffff74] to-[#d0d0d009] w-14 h-14 flex justify-center items-center border-2 border-white rounded-2xl ">
              <img src={stopIcon} alt="Search" className="w-6 h-6" />
            </div>
          ) : (
            <div className="  bg-gradient-to-r from-[#ffffff74] to-[#d0d0d009] w-14 h-14 flex justify-center items-center border-2 border-white rounded-2xl ">
              <img src={micIcon} alt="Search" className="w-6 h-6" />
            </div>
          )}
        </span>
      </div>
      <div className="flex flex-col bg-gray-100 bg-opacity-10 items-center justify-center w-full max-w-6xl p-10 border rounded-md shadow-glow transition">
        {isRecording && <Overlay />}
        <div className="flex items-center justify-center w-full max-w-6xl">
          <div className="grid grid-cols-3 gap-4 w-full">
            {presetQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => sendMessage(question)}
                disabled={isLoading}
                className="bg-gradient-to-r from-[#ff85e153] to-[#00eeff3e] bg-cover bg-center items-center text-center bg-no-repeat bg-opacity-10 rounded-sm p-4 text-cyan-400 hover:bg-cyan-400 hover:bg-opacity-20 hover:shadow-glow transition duration-300"
              >
                {question}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full mt-6">
          {displayedQuestions2.map((question, index) => (
            <button
              key={index}
              onClick={() => sendMessage(question)}
              disabled={isLoading}
              className="bg-gradient-to-br from-[#ff85e153] to-[#00eeff3e] bg-cover bg-center text-center bg-no-repeat items-center bg-opacity-10 rounded-md p-4  text-cyan-400 hover:bg-cyan-400 hover:bg-opacity-20 hover:shadow-glow transition duration-300"
            >
              {question}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
