import React, { useEffect, useCallback, useState } from "react";
import ReactPlayer from "react-player";
import { useSocket } from "../providers/Socket";
import { usePeer } from "../providers/Peer";

const RoomPage = () => {
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
  const [remoteEmailId, setRemoteEmailId] = useState();

  const handleNewUserJoined = useCallback(
    async (data) => {
      const { emailId } = data;
      console.log("New User joined room", emailId);
      const offer = await createOffer();
      socket.emit("call-user", { emailId, offer });
      setRemoteEmailId(emailId);
    },
    [createOffer, socket]
  );

  const handleIncomingCall = useCallback(
    async (data) => {
      const { from, offer } = data;
      console.log("Incoming Call from", from, offer);
      const ans = await createAnswers(offer);
      socket.emit("call-accepted", { emailId: from, ans });
      setRemoteEmailId(from);
    },
    [createAnswers, socket]
  );
  const handleCallAccepted = useCallback(
    async (data) => {
      const { ans, from } = data;
      console.log("Call Got Accepted", ans);
      await setRemoteAns(ans);
      setRemoteEmailId(from);
    },
    [setRemoteAns]
  );

  const getUserMediaStream = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });

    setMyStream(stream);
  }, []);
  const handleNegotiation = useCallback(async () => {
    if (remoteEmailId) {
      const offer = await createOffer();
      socket.emit("call-user", { emailId: remoteEmailId, offer });
    }
  }, [remoteEmailId, socket, createOffer]);

  useEffect(() => {
    socket.on("user-joined", handleNewUserJoined);
    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-accepted", handleCallAccepted);

    return () => {
      socket.off("user-joined", handleNewUserJoined);
      socket.off("incoming-call", handleIncomingCall);
      socket.off("call-accepted", handleCallAccepted);
    };
  }, [handleCallAccepted, handleIncomingCall, handleNewUserJoined, socket]);
  useEffect(() => {
    peer.addEventListener("negotiationneeded", handleNegotiation);

    return () => {
      peer.removeEventListener("negotiationneeded", handleNegotiation);
    };
  }, [handleNegotiation, peer]);
  useEffect(() => {
    getUserMediaStream();
  }, [getUserMediaStream]);

  useEffect(() => {
    if (myStream) {
      sendStream(myStream);
    }
  }, [myStream, sendStream]);
  return (
    <div className="room-page">
      <h1>Room Page</h1>
      <h4>You are connected to {remoteEmailId || "No one yet"}</h4>
      <div style={{ display: "flex", justifyContent: "space-around", marginTop: "20px" }}>
        <div>
          <h5>Your Stream</h5>
          <ReactPlayer url={myStream} playing width="400px" height="300px" />
        </div>
        <div>
          <h5>Remote Stream</h5>
          <ReactPlayer url={remoteStream} playing width="400px" height="300px" />
        </div>
      </div>
    </div>
  );
};

export default RoomPage;
