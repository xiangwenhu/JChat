const _WEBRTC_CONFIG_ = {
    local: document.querySelector('#local'),
    remote: document.querySelector('#remote'),
    socket: null,
    pc_config: { 'iceServers': [{ 'url': 'stun:stun.l.google.com:19302' }] },
    pc_constraints: { 'optional': [{ 'DtlsSrtpKeyAgreement': true }] },
    sdpConstraints: {
        mandatory: {
            OfferToReceiveAudio: true,
            OfferToReceiveVideo: true
        }
    }
}

class WebRTC {
    constructor(cfg) {
        //读取配置
        this.config = Object.assign({}, _WEBRTC_CONFIG_, cfg)
        this.local = this.config.local  //本地视频
        this.remote = this.config.remote //远程视频  
        this.pcLocal = this.pcRemote = null  //RTCPeerConnection
        this.socket = this.config.socket  //socket
        this.error = (this.config.error || this.error).bind(this)   // function 错误处理函数

        //内部变量
        this.localStream = null //本地流
        this.guest = false  //时候是访客
        this.start = false  //时候开始
    }

    init() {
        this.socket.on('webrtc', (type, data) => {
            this.handleMessages(type, data)
        })
        this.getUserMedia()
        this.socket.emit('webrtc', 'start')
    }

    stop(callback) {
        this.start = this.guest = false
        this.localStream = this.pcLocal = null
        this.local.pause()
        this.remote.pause()
        callback()
    }

    handleMessages(type, data) {
        switch (type) {
            case 'start':
                if (data.guest && data.guest == true) {
                    this.guest = true
                    this.getUserMedia()
                }
                break
            case 'candidate':
                console.log('receive candidate')
                var candidate = new RTCIceCandidate({
                    sdpMLineIndex: data.label,
                    candidate: data.candidate
                })
                console.log(candidate)
                this.pcLocal.addIceCandidate(candidate)
                break
            case 'offer':
                console.log('receive offer')
                // Callee creates PeerConnection
                if (!this.guest && !this.started) this.call()

                this.pcLocal.setRemoteDescription(new RTCSessionDescription(data))
                this.createAnswer()
                break
            case 'answer':
                console.log('receive answer')
                this.pcLocal.setRemoteDescription(new RTCSessionDescription(data))
                break
            case 'error':
                alert(data.msg)
                break

        }
    }

    getUserMedia() {
        navigator.getUserMedia({
            audio: true,
            video: true
        }, (stream) => {
            this.localStream = this.local.srcObject = stream
            this.local.play()
            if (this.guest) {
                this.call()
            }
        }, this.error)
    }

    call() {
        if (this.start) return
        this.start = true
        this.pcLocal = new RTCPeerConnection(this.config.pc_config, this.config.pc_constraints)
        this.pcLocal.onicecandidate = ev => {
            if (ev.candidate) {
                console.log('send candidate')
                this.socket.emit('webrtc', 'candidate', {
                    label: ev.candidate.sdpMLineIndex,
                    id: ev.candidate.sdpMid,
                    candidate: ev.candidate.candidate
                })
            }
        }
        this.pcLocal.oniceconnectionstatechange = () => {
            console.log('iceConnectionState: ' + this.pcLocal.iceConnectionState)
        }
        this.pcLocal.onsignalingstatechange = () => {
            console.log('signalingState: ' + this.pcLocal.signalingState)
        }
        this.pcLocal.onaddstream = (ev) => {
            this.remote.srcObject = ev.stream
            this.remote.play()
        }
        this.pcLocal.addStream(this.localStream)

        if (this.guest) {
            this.createOffer()
        }
    }

    createOffer() {
        this.pcLocal.createOffer(sd => {
            this.setLocalAndSendMessage('offer', sd)
        }, this.error, this.config.sdpConstraints)
    }

    createAnswer() {
        this.pcLocal.createAnswer((sd) => {
            this.setLocalAndSendMessage('answer', sd)
        }, this.error, this.config.sdpConstraints)
    }

    setLocalAndSendMessage(type, sd) {
        sd.sdp = sd.sdp
        this.pcLocal.setLocalDescription(sd)
        this.socket.emit('webrtc', type, sd)
    }

    error(err) {
        console.log('err:' + err)
    }

}