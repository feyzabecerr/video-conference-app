const video = document.getElementById('webcam1')
const canvas = document.getElementById('canvas1');

const webSocket = new WebSocket("ws://192.168.56.1:3000")

webSocket.onmessage = (event) => {
    handleSignallingData(JSON.parse(event.data))
}

function handleSignallingData(data) {
    switch (data.type) {
        case "answer":
            peerConn.setRemoteDescription(data.answer)
            break
        case "candidate":
            peerConn.addIceCandidate(data.candidate)
    }
}

let username
function sendUsername() {
    username = document.getElementById("username-input").value
    sendData({
        type: "store_user"
    })
}

function sendData(data) {
    data.username = username
    webSocket.send(JSON.stringify(data))
}


let localStream
let peerConn
function startCall() {
    document.getElementById("video-call-div")
    .style.display = "inline"

 
    navigator.getUserMedia({
        video: true,
        audio: true
    }, (stream) => {
        localStream = stream
        document.getElementById("webcam1").srcObject = localStream
        video.play();

        let configuration = {
            iceServers: [
                {
                    "urls": ["stun:stun.l.google.com:19302", 
                    "stun:stun1.l.google.com:19302", 
                    "stun:stun2.l.google.com:19302"]
                }
            ]
        }

        peerConn = new RTCPeerConnection(configuration)
        peerConn.addStream(localStream)

        peerConn.onaddstream = (e) => {
            document.getElementById("webcam2")
            .srcObject = e.stream
        }

        peerConn.onicecandidate = ((e) => {
            if (e.candidate == null)
                return
            sendData({
                type: "store_candidate",
                candidate: e.candidate
            })
        })

        createAndSendOffer()
    }, (error) => {
        console.log(error)
    })

}

function createAndSendOffer() {
    peerConn.createOffer((offer) => {
        sendData({
            type: "store_offer",
            offer: offer
        })

        peerConn.setLocalDescription(offer)
    }, (error) => {
        console.log(error)
    })
}

let isAudio = true
function muteAudio() {
    isAudio = !isAudio
    localStream.getAudioTracks()[0].enabled = isAudio
}

let isVideo = true
 function muteVideo() {
    isVideo = !isVideo
    localStream.getVideoTracks()[0].enabled = isVideo
  
}
    
async function removeBg() {
    // Loading bodyPix model
    const net = await bodyPix.load({
        architecture: 'MobileNetV1',
        outputStride: 16,
        multiplier: 0.75,
        quantBytes: 2
    });

    // Segmentation
    const segmentation = await net.segmentPerson(video, {
        flipHorizontal: false,
        internalResolution: 'medium',
        segmentationThreshold: 0.5
    });

    // Convert the segmentation into a mask to darken the background.
    const foregroundColor = { r: 0, g: 0, b: 0, a: 255 };
    const backgroundColor = { r: 0, g: 0, b: 0, a: 0 };
    const backgroundDarkeningMask = bodyPix.toMask(segmentation, foregroundColor, backgroundColor, false);

    compositeFrame(backgroundDarkeningMask);
}

async function compositeFrame(backgroundDarkeningMask) {
    if (!backgroundDarkeningMask) return;
    // grab canvas holding the bg image
    var ctx = canvas.getContext('2d');
    // composite the segmentation mask on top
    ctx.globalCompositeOperation = 'destination-over';
    ctx.putImageData(backgroundDarkeningMask, 0, 0);
    // composite the video frame
    ctx.globalCompositeOperation = 'source-in';
    ctx.drawImage(video, 0, 0, 640, 480);
}


$(".overlay").click(function () { // change canvas size
    setInterval(removeBg, 100);
    video.style.display='none';
    video.style.hidden  = 'true';
    canvas.style.backgroundImage =  'url(../images/hay.jpg)';
    canvas.style.border = '2px solid black';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.margin = '16px';
    canvas.style.position = 'absolute';
    canvas.style.maxWidth = '45%';
    canvas.style.maxHeight = '45%';
    canvas.style.borderRadius = '16px';
    console.log(canvas)

})