import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import searchIcon from "./assets/search-icon.png";
import micIcon from "./assets/mic.png";
import stopIcon from "./assets/icons8-stop-100.png";
import Overlay from "./Overlay.jsx";
import backgroundImage from "./assets/BGMain.png";
import io from "socket.io-client"; // Import Socket.IO client

const BASE_URL = "http://localhost:5000";
const BASE_URL_SOCKET = "http://192.168.56.1:3000";
const DEEPGRAM_API_KEY = "0c3313b4a4aa4332ac85cde977e5bc31be42ed0d"; // Replace with your actual API key

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
  const [activeButton, setActiveButton] = useState(null);
  const [buttonsDisabled, setButtonsDisabled] = useState(false);
  const inputRef = useRef(null);
  const audioRef = useRef(null);
  const appRef = useRef(null);
  const maxRecordingTime = 20000;
  const mediaRecorderRef = useRef(null);

  const socket = io(BASE_URL_SOCKET);
  console.log("activeButton", activeButton);
  const presetQuestions = [
    { question: "About Zephy", buttonIndex: 0 },
    { question: "Why Gen AI Matters?", buttonIndex: 1 },
    { question: "Share Gen AI Facts with us", buttonIndex: 2 },
    { question: "Gen AI COE", buttonIndex: 3 },
    { question: "AI Research Lab", buttonIndex: 4 },
    { question: "AI INSTITUTE", buttonIndex: 5 },
    { question: "AI ENABLE", buttonIndex: 6 },
    { question: "AI LEAP", buttonIndex: 7 },
    { question: "AI CONSORTIUM", buttonIndex: 8 },
  ];

  const displayedQuestions2 = [
    {
      question: "Value - We Enable for our Clients using Gen AI",
      buttonIndex: 9,
    },
    { question: "Deloitte Gen AI COE Capabilities", buttonIndex: 10 },
  ];
  const handleButtonInteraction = (question) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setAudioPlaying(false);
    }
    // socket.emit("button-clicked", 13);
    // clicked;
    setAudioPlaying(false);
    console.log("clicked");
    socket.emit("button-clicked", question.buttonIndex);

    if (question.buttonIndex === 0) {
      socket.emit("button-clicked", 13);
      console.log("sendign socket 0");
      socket.emit("button-clicked", question.buttonIndex);
    } else {
      socket.emit("button-clicked", 13);
      sendMessage(question.question);
    }
  };

  useEffect(() => {
    // Listen for 'stop-message' event from the server
    socket.on("stop-message", (message) => {
      console.log("stop message recived");
      console.log(message); // Log the "STOP" message or handle it as needed

      setButtonsDisabled(false);
      // setActiveButton(null);
    });

    return () => {
      socket.off("button-clicked");
      socket.off("stop-message");
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.addEventListener("ended", () => {
        setButtonsDisabled(false);
      });
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener("ended", () => {
          setButtonsDisabled(false);
          // setActiveButton(null);
        });
      }
    };
  }, [audioRef.current]);

  const buttonClass = () => {
    return ` 
        
     " h-[77px] opacity-80 bg-gradient-to-r from-[#E5A2D488]  to-[#00EEFF76] text-cyan-400 opacity-90 rounded md bg-transparent bg-cover bg-center items-center text-center bg-no-repeat bg-color- bg-opacity-10 rounded-sm p-4 transition duration-300 text-white bg-transparent   
    `;
  };

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
    console.log("inputValue", inputValue);
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
      setButtonsDisabled(true);
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

            // Convert the bot's response to speech
            await convertAndPlaySpeech(data.response);
            // } else if (chunk.includes("--audio")) {
            //   const audioBlob = await readAudioData(reader);
            //   playAudio(audioBlob);
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

  async function convertAndPlaySpeech(text) {
    const url = "https://api.deepgram.com/v1/speak?model=aura-asteria-en";

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Token ${DEEPGRAM_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: text }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const sourceNode = audioContext.createBufferSource();

      let audioChunks = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        audioChunks.push(value);
      }
      let index = 11;
      setActiveButton("all");
      socket.emit("button-clicked", index);
      const audioBlob = new Blob(audioChunks, { type: "audio/mp3" });
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      setAudioPlaying(true);

      audio.play();

      audio.addEventListener("ended", () => {
        setAudioPlaying(false);
        setButtonsDisabled(false);
        // setActiveButton(null);
        let index = 12;
        // setActiveButton(null);
        socket.emit("button-clicked", index);
      });
    } catch (error) {
      console.error("Error converting text to speech:", error);
      alert("Error converting text to speech. Please try again.");
      let index = 12;
      // setActiveButton(null);
      socket.emit("button-clicked", index);
    }
  }

  async function readAudioData(reader) {
    const chunks = [];
    const boundary = "--audio";
    let isAudio = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = new TextDecoder().decode(value, { stream: true });

      if (chunk.includes(boundary)) {
        isAudio = !isAudio; // Toggle audio state on boundary
        if (!isAudio) continue; // Skip boundary chunk
      }

      if (isAudio) {
        chunks.push(value);
      }
    }

    return new Blob(chunks, { type: "audio/mpeg" }); // or appropriate MIME type
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
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setAudioPlaying(false);
      }
      socket.emit("button-clicked", 13);
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
          const audioBlob = new Blob(chunks);
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
    console.log(data);
    if (
      data &&
      data.results &&
      data.results.channels &&
      data.results.channels[0].alternatives
    ) {
      const transcript = data.results.channels[0].alternatives[0].transcript;
      console.log(transcript);
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

  useEffect(() => {
    // Automatically focus the input field when the component mounts
    inputRef.current.focus();
  }, []);

  return (
    <div
      className=" h-screen bg-cover bg-center bg-no-repeat flex flex-col items-center justify-center  "
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      {!isFullscreen ? (
        <button
          className="absolute top-4 right-4 p-2  rounded-md transition-opacity duration-300 hover:opacity-100"
          // onClick={toggleFullScreen}
          onTouchStart={toggleFullScreen}
        >
          F
        </button>
      ) : (
        <button
          className="absolute top-4 right-4 p-2 bg-red-600 text-white rounded-md opacity-0 transition-opacity duration-300 hover:opacity-100"
          // onClick={toggleFullScreen}
          onTouchStart={toggleFullScreen}
        >
          x
        </button>
      )}
      <div className="flex h-14 items-center bg-gradient-to-r from-[#ffffff74] to-[#d0d0d009] absolute top-20 bg-opacity-10 rounded-2xl w-full max-w-6xl mb-12  border z-50 ">
        <img src={searchIcon} alt="Search" className="w-6 h-6 mx-2" />
        <input
          type="text"
          value={inputValue}
          ref={inputRef}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          placeholder={
            isRecording
              ? "Tap the button to stop recording"
              : !isLoading
              ? "Search"
              : "Loading..."
          }
          className="flex-grow bg-transparent border-none text-white placeholder-white focus:outline-none"
        />
        <span
          // onClick={toggleRecording}
          onTouchStart={toggleRecording}
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
      <div className="w-10 m-10"></div>
      <div className="flex flex-col   items-center justify-center w-full max-w-7xl    ">
        {isRecording && <Overlay />}
        <div className="flex items-center justify-center w-full max-w-8xl  ">
          <div className="grid grid-cols-3 gap-6 w-full mt-3">
            {presetQuestions.map((question, buttonIndex) => (
              <button
                key={buttonIndex}
                //  onClick={() => handleButtonInteraction(question)}
                onTouchStart={() => {
                  handleButtonInteraction(question, buttonIndex);
                }}
                className={buttonClass()}
                // className={buttonClass(question)}
              >
                {question.question}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 w-full mt-6  ">
          {displayedQuestions2.map((question, buttonIndex) => (
            <button
              key={buttonIndex}
              // onTouchStart
              onTouchStart={() => {
                handleButtonInteraction(question, buttonIndex);
              }}
              className={buttonClass()}
            >
              {question.question}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
