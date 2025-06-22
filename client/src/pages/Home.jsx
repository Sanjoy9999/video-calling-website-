import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../providers/Socket";

const HomePage = () => {
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [roomId, setRoomId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRoomJoined = useCallback(
    ({ roomId }) => {
      setIsLoading(false);
      navigate(`/room/${roomId}`);
    },
    [navigate]
  );

  useEffect(() => {
    socket.on("joined-room", handleRoomJoined);

    return () => {
      socket.off("joined-room", handleRoomJoined);
    };
  }, [handleRoomJoined, socket]);

  const handleJoinRoom = () => {
    if (!email || !roomId) {
      alert("Please enter both email and room code");
      return;
    }
    setIsLoading(true);
    socket.emit("join-room", { emailId: email, roomId });
  };

  const generateRandomRoomId = () => {
    const randomId = Math.random().toString(36).substring(2, 8);
    setRoomId(randomId);
  };

  return (
    <div className="homepage-container">
      <div className="input-container slide-up">
        <h2>Video Meeting</h2>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Enter your email here"
          disabled={isLoading}
        />
        
        <div className="meeting-id-container" style={{ position: "relative", marginBottom: "16px" }}>
          <label
            htmlFor="meetingIdInput"
            style={{
              display: "block",
              marginBottom: "5px",
              textAlign: "left",
              fontSize: "14px",
              color: "#555",
            }}
          >
            Meeting ID
          </label>
          <div style={{ display: "flex", alignItems: "center" }}>
            <input
              id="meetingIdInput"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              type="text"
              placeholder="Enter or paste meeting ID"
              disabled={isLoading}
              style={{ 
                flex: 1,
                paddingRight: "40px" ,
                color:"black",
                width:"300px"
              }}
            />
            <button
              style={{
                marginLeft: "9px",
                background: "#f0f0f0",
                border: "1px solid #ddd",
                borderRadius: "4px",
                color: "#4285f4",
                cursor: "pointer",
                padding: "4px 6px",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: "auto",
                height: "42px",
                marginBottom:"15px"
              }}
              onClick={generateRandomRoomId}
              title="Generate random meeting ID"
              type="button"
              disabled={isLoading}
            >
              Generate
            </button>
          </div>
        </div>
        
        <button onClick={handleJoinRoom} disabled={isLoading}>
          {isLoading ? "Joining..." : "Join Meeting"}
        </button>
      </div>
    </div>
  );
};

export default HomePage;
