import React, { useEffect, useCallback, useState, useRef } from "react";
import ReactPlayer from "react-player";
import { useSocket } from "../providers/Socket";
import { usePeer } from "../providers/Peer";
import { useParams, useNavigate } from "react-router-dom";

const RoomPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const {
    peer,
    createOffer,
    createAnswers,
    setRemoteAns,
    sendStream,
    remoteStream,
  } = usePeer();

  const [myStream, setMyStream] = useState(null);
  const [remoteEmailId, setRemoteEmailId] = useState("");
  const [participants, setParticipants] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const myVideoRef = useRef();
  const screenTrackRef = useRef(null);

  // Handle new user joining the room
  const handleNewUserJoined = useCallback(
    async (data) => {
      const { emailId } = data;
      console.log("New User joined room", emailId);
      const offer = await createOffer();
      socket.emit("call-user", { emailId, offer });
      setRemoteEmailId(emailId);

      // Add new participant
      setParticipants(prev => [...prev, { 
        email: emailId, 
        stream: null,
        connected: false 
      }]);
    },
    [createOffer, socket]
  );

  // Handle incoming call
  const handleIncomingCall = useCallback(
    async (data) => {
      const { from, offer } = data;
      console.log("Incoming Call from", from, offer);
      const ans = await createAnswers(offer);
      socket.emit("call-accepted", { emailId: from, ans });
      setRemoteEmailId(from);
      
      // Add caller as participant if not already present
      setParticipants(prev => {
        if (!prev.find(p => p.email === from)) {
          return [...prev, { 
            email: from, 
            stream: null,
            connected: false 
          }];
        }
        return prev;
      });
    },
    [createAnswers, socket]
  );

  // Handle call accepted
  const handleCallAccepted = useCallback(
    async (data) => {
      const { ans, from } = data;
      console.log("Call Got Accepted", ans);
      await setRemoteAns(ans);
      setRemoteEmailId(from);
      
      // Update participant status
      setParticipants(prev => 
        prev.map(p => 
          p.email === from 
            ? { ...p, connected: true } 
            : p
        )
      );
    },
    [setRemoteAns]
  );

  // Handle user left the room
  const handleUserLeft = useCallback((data) => {
    const { emailId } = data;
    console.log("User left room", emailId);
    
    setParticipants(prev => prev.filter(p => p.email !== emailId));
    
    if (remoteEmailId === emailId) {
      setRemoteEmailId("");
    }
  }, [remoteEmailId]);

  // Get user media stream
  const getUserMediaStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      setMyStream(stream);
    } catch (error) {
      console.error("Error accessing media devices:", error);
      alert("Failed to access camera and microphone. Please check permissions.");
    }
  }, []);

  // Handle WebRTC negotiation
  const handleNegotiation = useCallback(async () => {
    if (remoteEmailId) {
      const offer = await createOffer();
      socket.emit("call-user", { emailId: remoteEmailId, offer });
    }
  }, [remoteEmailId, socket, createOffer]);

  // Toggle microphone
  const toggleMute = useCallback(() => {
    if (myStream) {
      myStream.getAudioTracks().forEach(track => {
        // When muted, enabled should be false
        // When unmuted, enabled should be true
        track.enabled = !isMuted;
      });
      setIsMuted(!isMuted);
    }
  }, [myStream, isMuted]);

  // Toggle camera
  const toggleVideo = useCallback(() => {
    if (myStream) {
      myStream.getVideoTracks().forEach(track => {
        track.enabled = isVideoOff;
      });
      setIsVideoOff(!isVideoOff);
    }
  }, [myStream, isVideoOff]);

  // Start screen sharing
  const startScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      if (screenTrackRef.current) {
        screenTrackRef.current.getTracks().forEach(track => track.stop());
      }
      // Restore camera stream
      getUserMediaStream();
      setIsScreenSharing(false);
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true
      });
      
      screenTrackRef.current = screenStream;
      
      // Replace video track with screen track
      if (myStream) {
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = peer.getSenders().find(s => s.track && s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
        
        // Create a new combined stream
        const newStream = new MediaStream();
        // Add screen video track
        newStream.addTrack(videoTrack);
        // Add original audio track if exists
        const audioTrack = myStream.getAudioTracks()[0];
        if (audioTrack) {
          newStream.addTrack(audioTrack);
        }
        
        setMyStream(newStream);
        setIsScreenSharing(true);
        
        // Stop sharing when screen share is ended by the user
        videoTrack.onended = () => {
          stopScreenShare();
        };
      }
    } catch (error) {
      console.error("Error sharing screen:", error);
    }
  }, [isScreenSharing, myStream, getUserMediaStream, peer]);

  // Stop screen sharing
  const stopScreenShare = useCallback(() => {
    if (screenTrackRef.current) {
      screenTrackRef.current.getTracks().forEach(track => track.stop());
      screenTrackRef.current = null;
    }
    
    // Restore camera stream
    getUserMediaStream();
    setIsScreenSharing(false);
  }, [getUserMediaStream]);

  // Leave meeting
  const leaveMeeting = useCallback(() => {
    // Stop all tracks
    if (myStream) {
      myStream.getTracks().forEach(track => track.stop());
    }
    if (screenTrackRef.current) {
      screenTrackRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Notify other participants
    socket.emit("leave-room", { roomId });
    
    // Navigate back to homepage
    navigate("/");
  }, [myStream, navigate, roomId, socket]);

  // Copy meeting ID
  const copyMeetingId = useCallback(() => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [roomId]);

  // Update remote streams when available
  useEffect(() => {
    if (remoteStream) {
      setParticipants(prev => 
        prev.map(p => 
          p.email === remoteEmailId 
            ? { ...p, stream: remoteStream, connected: true } 
            : p
        )
      );
    }
  }, [remoteStream, remoteEmailId]);

  // Set up socket listeners
  useEffect(() => {
    socket.on("user-joined", handleNewUserJoined);
    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-accepted", handleCallAccepted);
    socket.on("user-left", handleUserLeft);

    return () => {
      socket.off("user-joined", handleNewUserJoined);
      socket.off("incoming-call", handleIncomingCall);
      socket.off("call-accepted", handleCallAccepted);
      socket.off("user-left", handleUserLeft);
    };
  }, [handleCallAccepted, handleIncomingCall, handleNewUserJoined, handleUserLeft, socket]);

  // Set up WebRTC negotiation event
  useEffect(() => {
    peer.addEventListener("negotiationneeded", handleNegotiation);

    return () => {
      peer.removeEventListener("negotiationneeded", handleNegotiation);
    };
  }, [handleNegotiation, peer]);

  // Get user media on initial load
  useEffect(() => {
    getUserMediaStream();
  }, [getUserMediaStream]);

  // Send stream to peers when available - only do this once when stream changes
  useEffect(() => {
    if (myStream) {
      sendStream(myStream).catch(err => {
        console.error("Error sending stream:", err);
      });
    }
  }, [myStream, sendStream]);

  return (
    <div className="room-page">
      <div className="room-header">
        <div className="room-title">Video Meeting</div>
        <div className="room-info">
          <span>Meeting ID: {roomId}</span>
          <button 
            onClick={copyMeetingId}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8ab4f8',
              marginLeft: '10px',
              cursor: 'pointer'
            }}
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      </div>
      
      <div className="video-grid">
        {/* My video */}
        <div className="video-container my-stream fade-in">
          <ReactPlayer 
            url={myStream} 
            playing 
            muted 
            width="100%" 
            height="100%" 
          />
          <div className="participant-name">You {isMuted && '🔇'} {isVideoOff && '🎦'}</div>
        </div>
        
        {/* Remote videos */}
        {participants.filter(p => p.stream).map((participant, index) => (
          <div key={participant.email} className="video-container fade-in">
            <ReactPlayer 
              url={participant.stream} 
              playing 
              width="100%" 
              height="100%" 
            />
            <div className="participant-name">{participant.email.split('@')[0]}</div>
          </div>
        ))}
      </div>
      
      <div className="controls-container">
        <button 
          className={`control-button ${isMuted ? 'active' : ''}`} 
          onClick={toggleMute} 
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
        
        <button 
          className={`control-button ${isVideoOff ? 'active' : ''}`} 
          onClick={toggleVideo}
          title={isVideoOff ? "Turn on camera" : "Turn off camera"}
        >
          {isVideoOff ? '📵' : '📹'}
        </button>
        
        <button 
          className={`control-button ${isScreenSharing ? 'active' : ''}`} 
          onClick={startScreenShare}
          title={isScreenSharing ? "Stop sharing" : "Share screen"}
        >
          {isScreenSharing ? '⏹️' : '📊'}
        </button>
        
        <button 
          className="control-button end-call" 
          onClick={leaveMeeting}
          title="Leave meeting"
        >
          📞
        </button>
      </div>
    </div>
  );
};

export default RoomPage;
