//import { setSocketId } from './store.js';
import * as store from "./store.js";
import * as wss from "./wss.js";
import * as constants from "./constants.js";
import * as webRTCHandler from "./webRTCHandler.js";
import * as ui from "./ui.js";

const socket = io("/");
webRTCHandler.getLocalPreview();

console.log("Main Script loded");
wss.registerSocketEvents(socket);

//register event listener for personal code copy button
const personalCodeCopyButton = document.getElementById(
  "personal_code_copy_button"
);
personalCodeCopyButton.addEventListener("click", () => {
  const personalCode = store.getState().socketId;
  // get the socketId  and copy to the clipboard
  navigator.clipboard && navigator.clipboard.writeText(personalCode);
});

// register event listeners for connection buttons

const personalCodeChatButton = document.getElementById(
  "personal_code_chat_button"
);

const personalCodeVideoButton = document.getElementById(
  "personal_code_video_button"
);

personalCodeChatButton.addEventListener("click", () => {
  console.log("chat button clicked");

  const calleePersonalCode = document.getElementById(
    "personal_code_input"
  ).value;
  const callType = constants.callType.CHAT_PERSONAL_CODE;

  webRTCHandler.sendPreOffer(callType, calleePersonalCode);

  // wss.sendPreOffer({callType, calleePersonalCode}) ;
});

personalCodeVideoButton.addEventListener("click", () => {
  console.log("video button clicked");

  const calleePersonalCode = document.getElementById(
    "personal_code_input"
  ).value;
  const callType = constants.callType.VIDEO_PERSONAL_CODE;

  webRTCHandler.sendPreOffer(callType, calleePersonalCode);
});

// event listeners for video call buttons

const micButton = document.getElementById("mic_button");
micButton.addEventListener("click", () => {
  const localStream = store.getState().localStream;
  const micEnabled = localStream.getAudioTracks()[0].enabled;
  localStream.getAudioTracks()[0].enabled = !micEnabled;
  ui.updateMicButton(micEnabled);
});

const cameraButton = document.getElementById("camera_button");
cameraButton.addEventListener("click", () => {
  const localStream = store.getState().localStream;
  const cameraEnabled = localStream.getVideoTracks()[0].enabled;
  localStream.getVideoTracks()[0].enabled = !cameraEnabled;
  ui.updateCameraButton(cameraEnabled);
});

// Move local video
var draggableElement = document.getElementById("local_video");
var offsetX, offsetY;

draggableElement.addEventListener("mousedown", function (e) {
  console.log("Mouse Down  ->");
  // Store the initial mouse position
  offsetX = e.clientX - draggableElement.getBoundingClientRect().left;
  offsetY = e.clientY - draggableElement.getBoundingClientRect().top;

  // Change the cursor style
  draggableElement.style.cursor = "grabbing";

  // Add event listeners for moving and releasing the element
  document.addEventListener("mousemove", moveElement);
  document.addEventListener("mouseup", releaseElement);
});

// Function to move the element
function moveElement(e) {
  console.log("Mouse moving ->");
  draggableElement.style.left = e.clientX - offsetX - 500 + "px";
  draggableElement.style.top = e.clientY - offsetY - 30 + "px";
}

// Function to release the element
function releaseElement() {
  console.log("Mouse up ->");
  // Remove event listeners
  document.removeEventListener("mousemove", moveElement);
  document.removeEventListener("mouseup", releaseElement);

  // Reset cursor style
  draggableElement.style.cursor = "grab";
}

const switchForScreenSharingButton = document.getElementById(
  "screen_sharing_button"
);
switchForScreenSharingButton.addEventListener("click", () => {
  const screenSharingActive = store.getState().screenSharingActive;
  webRTCHandler.switchBetweenCameraAndScreenSharing(screenSharingActive);
});

const remoteVideo = document.getElementById("remote_video");

let isFullScreen = false;

remoteVideo.addEventListener("dblclick", () => {
  if (!isFullScreen) {
    if (remoteVideo.requestFullscreen) {
      remoteVideo.requestFullscreen();
    }

    isFullScreen = true;
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }

    isFullScreen = false;
  }
});
