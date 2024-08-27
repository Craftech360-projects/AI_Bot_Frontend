import { useState, useEffect, useRef } from "react";
import "./App.css";

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
  const audioRef = useRef(null);
  const appRef = useRef(null);
  const maxRecordingTime = 10000;
  const mediaRecorderRef = useRef(null); // 25 seconds in milliseconds

  const presetQuestions = [
    "AI INSTITUTE",
    "AI LEAP",
    "AI ENABLE",
    "AI CONSORTIUM",
    "About Deloitte",
    "Deloitte Gen AI COE Capabilities",
    "Why it Gen AI Matters?",
    "Gen AI COE",
    "Share Gen AI Facts with us",
    "AI Research Lab",
  ];

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setFullscreen(false);
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
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
        setAudioPlaying(false);
      }

      appendMessage("user", message);
      setIsLoading(true); // Show loading state

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
            // JSON response
            const data = JSON.parse(chunk);
            appendMessage("bot", data.response);
          } else if (chunk.includes("--audio")) {
            // Start of audio data
            const audioBlob = await readAudioData(reader);
            playAudio(audioBlob);
          }
        }
      } catch (error) {
        console.error("Error:", error);
        appendMessage("bot", "There was an error processing your request.");
      } finally {
        setIsLoading(false); // Remove loading state
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
    audioRef.current = audio; // Store the current audio
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
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder; // Store the recorder in the ref
        setMediaRecorder(recorder);

        let chunks = []; // Local variable to store chunks

        recorder.addEventListener("dataavailable", (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data); // Add chunk to local array
          }
        });

        recorder.addEventListener("stop", () => {
          const audioBlob = new Blob(chunks, { type: "audio/webm" });
          sendAudioToDeepgram(audioBlob);
        });

        recorder.start();
        setIsRecording(true);
        console.log("time start");
        // Automatically stop recording after maxRecordingTime
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

  return (
    <div className="App">
      <button
        onClick={toggleFullScreen}
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          width: "40px",
          height: "40px",
          backgroundColor: "transparent", // Make background transparent
          border: "none", // Remove any border
          opacity: 0, // Make the button invisible
          cursor: "pointer",
          zIndex: 1000,
        }}
        aria-label="Toggle Fullscreen" // Accessible label for screen readers
      ></button>
      <div className="question-grid">
        {presetQuestions.map((question, index) => (
          <button
            key={index}
            onClick={() => sendMessage(question)}
            disabled={isLoading}
          >
            {question}
          </button>
        ))}
      </div>
      <div id="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}-message`}>
            {msg.message}
          </div>
        ))}
        {isLoading && (
          <div className="loading-message">Waiting for reply...</div>
        )}
      </div>
      <div className="input-area">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter your question"
          disabled={isLoading}
        />
        <button
          style={{
            backgroundColor: isLoading ? "gray" : "#128416",
            color: "white",
          }}
          onClick={() => sendMessage(inputValue)}
          disabled={isLoading}
        >
          Send
        </button>
        <button
          onClick={toggleRecording}
          disabled={isLoading}
          style={{
            backgroundColor: isLoading
              ? "gray"
              : isRecording
              ? "red"
              : "#2D72E9",
            color: "white",
          }}
        >
          {isRecording ? "Stop Recording" : "Record"}
        </button>
      </div>
    </div>
  );
}

export default App;
