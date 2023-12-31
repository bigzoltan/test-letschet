import * as wss from "./wss.js";
import * as constants from "./constants.js";
import * as ui from "./ui.js";
import * as store from "./store.js";

let connectedUserDetails;
let peerConection;
let dataChannel;
let RemoteUserDetails;

const defaultConstraints = {
  audio: true,
  video: true,
};

// Google STUN server adress
const configuration = {
  iceServers: [
    {
      urls: "stun:stun1.1.google.com:19302",
    },

    {
      urls: "stun:stun3.1.google.com:19302",
    },
    {
      urls: "stun:stun4.1.google.com:19302",
    },
  ],
};

const createPeerConnection = () => {
  peerConection = new RTCPeerConnection(configuration);

  dataChannel = peerConection.createDataChannel("chat");

  peerConection.ondatachannel = (event) => {
    const dataChannel = event.channel;

    dataChannel.onopen = () => {
      console.log("peer connection is ready to receive data channel messages");
      store.setcallInProgress(true);
    };

    dataChannel.onmessage = (event) => {
      console.log("message came from data channel");
      const message = JSON.parse(event.data);
      console.log("Message ->", message);
      ui.appendMessage(message);
    };
  };

  peerConection.onicecandidate = (event) => {
    console.log("geeting ice candidates from stun server");

    if (event.candidate) {
      // send our ice candidates to other peer
      wss.sendDataUsingWebRTCSignaling({
        connectedUserSocketId: connectedUserDetails.socketId,
        type: constants.webRTCSignaling.ICE_CANDIDATE,
        candidate: event.candidate,
      });
    }
  };

  peerConection.onconnectionstatechange = (event) => {
    if (peerConection.connectionState === "connected") {
      console.log("succesfully connected with other peer => ", event);
    }
  };

  // receiving tracks
  const remoteStream = new MediaStream();
  store.setRemoteStream(remoteStream);
  ui.updateRemoteVideo(remoteStream);

  peerConection.ontrack = (event) => {
    remoteStream.addTrack(event.track);
  };

  // add our stream to peer connection

  if (
    connectedUserDetails.callType === constants.callType.VIDEO_PERSONAL_CODE
  ) {
    const localStream = store.getState().localStream;
    console.log("LocalStream -> ", localStream);

    for (const track of localStream.getTracks()) {
      peerConection.addTrack(track, localStream);
    }
  }
};

export const sendMessageUsingDataChannel = (message) => {
  const stringifiedMessage = JSON.stringify(message);
  dataChannel.send(stringifiedMessage);
};

export const getLocalPreview = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(
      defaultConstraints
    );
    //  ui.updateLocalVideo(stream);
    store.setLocalStream(stream);
  } catch (err) {
    console.log("error occured when trying to get an access to camera");
    console.log(err);
  }
};

export const sendPreOffer = (callType, calleePersonalCode) => {
  connectedUserDetails = {
    callType,
    socketId: calleePersonalCode,
  };

  if (
    callType === constants.callType.CHAT_PERSONAL_CODE ||
    callType === constants.callType.VIDEO_PERSONAL_CODE
  ) {
    const data = {
      callType,
      calleePersonalCode,
    };
    ui.showCallingDialog(callingDialogRejectCallHandler);
    wss.sendPreOffer(data);
  }
};

export const handlePreOffer = (data) => {
  // Call not in Progress
  if (!store.getState().callInProgress) {
    const { callType, callerSocketId } = data;

    connectedUserDetails = {
      socketId: callerSocketId,
      callType: callType,
    };

    if (
      callType === constants.callType.CHAT_PERSONAL_CODE ||
      callType === constants.callType.VIDEO_PERSONAL_CODE
    ) {
      console.log("showing call dialog");
      ui.showIncomingCallDialog(callType, acceptCallHandler, rejectCallHandler);
    }
    console.log("Event Recived from otere side ->", data);
    store.state.callType = callType;
  } else {
    // Call in progress

    const { callType, callerSocketId } = data;

    RemoteUserDetails = {
      callerSocketId: callerSocketId,
      preOfferAnswer: constants.preOfferAnswer.CALL_BUSY,
    };

    console.log("Call Rejected we are BUSY =>", RemoteUserDetails);

    wss.sendPreOfferAnswer(RemoteUserDetails);
  }
};

const acceptCallHandler = () => {
  createPeerConnection();
  const iStream = store.getState().localStream;
  console.log("store.state.callType", store.getState().callType);

  if (store.state.callType === "VIDEO_PERSONAL_CODE")
    ui.updateLocalVideo(iStream);

  console.log("call accepted");
  sendPreOfferAnswer(constants.preOfferAnswer.CALL_ACCEPTED);
  ui.showCallElements(connectedUserDetails.callType);
};

const rejectCallHandler = () => {
  console.log("call rejected");
  sendPreOfferAnswer(constants.preOfferAnswer.CALL_REJECTED);
  ui.removeAllDialogs();
};

const callingDialogRejectCallHandler = () => {
  console.log("rejecting the call");
  const data = {
    connectedUserSocketId: connectedUserDetails.socketId,
  };
  closePeerConnectionAndResetState();
  wss.sendUserHangeUp(data);

  ui.removeAllDialogs();
};

const sendPreOfferAnswer = (preOfferAnswer) => {
  const data = {
    callerSocketId: connectedUserDetails.socketId,
    preOfferAnswer: preOfferAnswer,
  };
  ui.removeAllDialogs();
  wss.sendPreOfferAnswer(data);
};

export const handlePreOfferAnswer = (data) => {
  const { preOfferAnswer } = data;

  ui.removeAllDialogs();

  if (preOfferAnswer === constants.preOfferAnswer.CALLEE_NOT_FOUND) {
    console.log(
      "Answer from other side ->",
      constants.preOfferAnswer.CALLEE_NOT_FOUND
    );
    ui.showInfoDialog(preOfferAnswer);
    // show dialog that callee has not been found
  }

  if (preOfferAnswer === constants.preOfferAnswer.CALL_UNAVAILABLE) {
    ui.showInfoDialog(preOfferAnswer);
    // show dialog that callee is not able to connect
  }

  if (preOfferAnswer === constants.preOfferAnswer.CALL_BUSY) {
    console.log("Calle side is BUSY =>");
    ui.showInfoDialog(preOfferAnswer);
    // show dialog that callee is not able to connect
  }

  if (preOfferAnswer === constants.preOfferAnswer.CALL_REJECTED) {
    console.log(
      "Answer from other side ->",
      constants.preOfferAnswer.CALL_REJECTED
    );
    ui.showInfoDialog(preOfferAnswer);
    // show dialog that call is rejected by the callee
  }

  if (preOfferAnswer === constants.preOfferAnswer.CALL_ACCEPTED) {
    createPeerConnection();
    console.log(
      "Answer from other side ->",
      constants.preOfferAnswer.CALL_ACCEPTED
    );
    const iStream = store.getState().localStream;
    if (store.state.callType === "VIDEO_PERSONAL_CODE")
      ui.updateLocalVideo(iStream);

    // getLocalPreview() ;
    ui.showCallElements(connectedUserDetails.callType);
    // send webRTC offer
    sendWebRTCOffer();
  }
};

const sendWebRTCOffer = async () => {
  const offer = await peerConection.createOffer();
  await peerConection.setLocalDescription(offer);
  wss.sendDataUsingWebRTCSignaling({
    connectedUserSocketId: connectedUserDetails.socketId,
    type: constants.webRTCSignaling.OFFER,
    offer: offer,
  });
};

export const handleWebRTCOffer = async (data) => {
  console.log("WebRTC Offer came ");
  console.log(data);
  await peerConection.setRemoteDescription(data.offer);
  const answer = await peerConection.createAnswer();
  await peerConection.setLocalDescription(answer);
  wss.sendDataUsingWebRTCSignaling({
    connectedUserSocketId: connectedUserDetails.socketId,
    type: constants.webRTCSignaling.ANSWER,
    answer: answer,
  });
};

export const handleWebRTCAnswer = async (data) => {
  console.log("handling webRTC Answer");
  await peerConection.setRemoteDescription(data.answer);
};

export const handleWebRTCCandidate = async (data) => {
  console.log("handling incoming webRTC candidates");
  try {
    await peerConection.addIceCandidate(data.candidate);
  } catch (err) {
    console.error(
      "error occured when trying to add received ice candidate",
      err
    );
  }
};

let screenSharingStream;

export const switchBetweenCameraAndScreenSharing = async (
  screenSharingActive
) => {
  if (screenSharingActive) {
    const localStream = store.getState().localStream;
    const senders = peerConection.getSenders();

    const sender = senders.find((sender) => {
      return sender.track.kind === localStream.getVideoTracks()[0].kind;
    });

    if (sender) {
      sender.replaceTrack(localStream.getVideoTracks()[0]);
    }

    // stop screen sharing stream

    store
      .getState()
      .screenSharingStream.getTracks()
      .forEach((track) => track.stop());

    store.setScreenSharingActive(!screenSharingActive);

    ui.updateLocalVideo(localStream);
  } else {
    console.log("switching for screen sharing");
    try {
      screenSharingStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      store.setScreenSharingStream(screenSharingStream);

      // replace track which sender is sending
      const senders = peerConection.getSenders();

      const sender = senders.find((sender) => {
        return (
          sender.track.kind === screenSharingStream.getVideoTracks()[0].kind
        );
      });

      if (sender) {
        sender.replaceTrack(screenSharingStream.getVideoTracks()[0]);
      }

      store.setScreenSharingActive(!screenSharingActive);

      ui.updateLocalVideo(screenSharingStream);
    } catch (err) {
      console.error(
        "error occured when trying to get screen sharing stream",
        err
      );
    }
  }
};

// hang up
export const handleHangUp = () => {
  console.log("Finishing the call ");

  const data = {
    connectedUserSocketId: connectedUserDetails.socketId,
  };
  wss.sendUserHangeUp(data);
  closePeerConnectionAndResetState();
};

export const handleConnectedUserHangedUp = () => {
  console.log("connected peer hanged up");
  closePeerConnectionAndResetState();
};

const closePeerConnectionAndResetState = () => {
  if (peerConection) {
    peerConection.close();
    peerConection = null;
  }

  // active mic and camera
  if (
    connectedUserDetails.callType === constants.callType.VIDEO_PERSONAL_CODE ||
    connectedUserDetails.callType === constants.callType.VIDEO_STRANGER
  ) {
    store.getState().localStream.getVideoTracks()[0].enabled = false;
    store.getState().localStream.getAudioTracks()[0].enabled = false;
    getLocalPreview();
  }
  ui.updateUIAfterHangUp(connectedUserDetails.callType);
  connectedUserDetails = null;
  store.setcallInProgress(false);
};
