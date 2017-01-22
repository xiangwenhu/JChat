define(function (require, exports, module) {
 

    require('./adapter')

    const config = require('./config')
    const util = require('./util'),
        { parseURL } = util,
        getUserMedia = navigator.getUserMedia;


    var fnErr = function (ev) { console.log('err', ev); };

    var socket = io.connect('https://' + location.host),
        guest = false, localStream,
        vidLocal, vidRemote,
        roomId, started;

    var webRTC = {
        init: function () {
            vidLocal = document.querySelector('#vidLocal');
            vidRemote = document.querySelector('#vidRemote');

            socket.on('message', function (data) {
                webRTC.handleMessages(data);
            });

            this.getUserMedia();
        },
        handleMessages: function (data) {
            switch (data.type) {
                case 'enterroom': //进入房间
                    console.log('enterroom:' + JSON.stringify(data))
                    if (data.guest === true) {
                        guest = true;
                        localStream && webRTC.call();
                    }
                    break;
                case 'leaveroom': //离开房间
                    started = false;
                    guest = false;
                    break;
                case "candidate":
                    console.log('receive candidate');
                    var candidate = new RTCIceCandidate({
                        sdpMLineIndex: data.label,
                        candidate: data.candidate
                    });
                    console.log(candidate);
                    pc1.addIceCandidate(candidate);
                    break;
                case "offer":
                    console.log('receive offer');
                    // Callee creates PeerConnection
                    if (!config.guest && !started) webRTC.call();

                    pc1.setRemoteDescription(new RTCSessionDescription(data));
                    webRTC.createAnswer();
                    break;
                case "answer":
                    console.log('receive answer');
                    pc1.setRemoteDescription(new RTCSessionDescription(data));
                    break;
                case 'error':
                    alert(data.msg);
                    break;

            }
        },
        getUserMedia: function () {
            getUserMedia({
                audio: true,
                video: true
            }, function (stream) {
                vidLocal.srcObject = stream;
                vidLocal.play();
                localStream = stream;

                if (guest) {
                    webRTC.call();
                }
            }, function () { });
        },
        call: function () {
            if (started) return;

            started = true;

            pc1 = new RTCPeerConnection(config.pc_config, config.pc_constraints);

            pc1.onicecandidate = function (ev) {
                if (ev.candidate) {
                    console.log('send candidate');
                    socket.emit('send', {
                        type: 'candidate',
                        label: ev.candidate.sdpMLineIndex,
                        id: ev.candidate.sdpMid,
                        candidate: ev.candidate.candidate
                    });
                }
            };
            pc1.oniceconnectionstatechange = function () {
                console.log('iceConnectionState: ' + this.iceConnectionState);
            }
            pc1.onsignalingstatechange = function () {
                console.log('signalingState: ' + this.signalingState);
            }

            pc1.onaddstream = function (ev) {
                vidRemote.srcObject = ev.stream;
                vidRemote.play();

            }
            pc1.addStream(localStream);

            if (guest) {
                webRTC.createOffer();
            }
        },
        createAnswer: function () {
            pc1.createAnswer(function (sd) {
                console.log('create answer');
                webRTC.setLocalAndSendMessage(sd);
            }, fnErr, config.sdpConstraints);
        },
        //客人发起视频请求
        createOffer: function () {
            pc1.createOffer(function (sd) {
                console.log('create offer');
                webRTC.setLocalAndSendMessage(sd);
            }, fnErr, config.sdpConstraints);
        },
        setLocalAndSendMessage: function (sessionDescription) {
            // Set Opus as the preferred codec in SDP if Opus is present.
            sessionDescription.sdp = sessionDescription.sdp;
            pc1.setLocalDescription(sessionDescription);
            socket.emit('send', sessionDescription);
        }
    };


    module.exports = {
        enterRoom: function () {
            var params = parseURL(window.location.href).params;
            roomId = params.id;

            webRTC.init();
            socket.emit('send', { "type": "enterroom", "roomId": roomId });
        }
    };
});
