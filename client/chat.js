class Chat {
    constructor(url) {
        this.socketUrl = url || 'https://' + location.host
        this.rooms = []   //所在房间   
        this.socket = null
        this.id = null
        this.userName = localStorage.getItem('_JCHAT_USER_NAME_')
    }

    getSocket() {
        return this.socket
    }

    init(options = {}) {

        this.socket = io.connect(this.socketUrl)

        this.socket.on('connect', () => {
            this.id = this.socket.id
            this.socket.emit('chat', 'userName', this.userName)
        })

        this.socket.on('chat', (type, data) => {
            switch (type) {
                case 'allClients':
                case 'message':
                case 'sysmessage':
                case 'enterRoom':
                    typeof options[type] == 'function' && options[type](data)
                    break
                default:
                    break
            }
        })
    }

    //创建房间
    createRoom(roomName) {
        this.socket.emit('createRoom', roomName)
    }
    //进入房间
    enterRoom(userName, roomName) {
        this.socket.emit('enterRoom', userName, roomName)
    }
    //消息
    message(data) {
        this.socket.emit('message', data)
    }
}