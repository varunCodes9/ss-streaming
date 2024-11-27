const socket = io();
let localStream;
let peerConnection;
const remoteVideoElement = document.getElementById("remoteVideo");

// Get the video element for local sharing
const videoElement = document.getElementById("video");
const startShareButton = document.getElementById("startShare");

startShareButton.addEventListener("click", async () => {
  try {
    // Request to share the screen
    localStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true, // If you want to share audio as well
    });

    videoElement.srcObject = localStream;

    // Create a new RTCPeerConnection
    peerConnection = new RTCPeerConnection();

    // Add the local stream to the peer connection
    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });

    // Create an offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit("offer", offer);

    // Handle incoming answer
    socket.on("answer", async (answer) => {
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    });

    // Handle incoming ICE candidates
    socket.on("ice-candidate", (candidate) => {
      peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    });

    // Handle ICE candidate generation
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", event.candidate);
      }
    };

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      remoteVideoElement.srcObject = event.streams[0]; // Set the remote video stream
    };
  } catch (error) {
    console.error("Error sharing screen:", error);
  }
});
