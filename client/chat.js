class Chat {
    constructor(url) {
        this.socketUrl = url || 'https://' + location.host
        this.rooms = []      
        this.socket = null
    }

    getSocket(){
        return this.socket
    }

    init(options = {}) {
        this.socket = io.connect(this.socketUrl)
        this.socket.on('connect', () => {
        })
        //获取所有房间
        this.socket.on('rooms', data => {
            this.rooms = Array.from(data)
            typeof options.rooms == 'function' &&  options.rooms(this.rooms)            
        })
        //消息
        this.socket.on('message', data => {
            typeof options.message == 'function' && options.message(data)
        })
        // 系统消息
        this.socket.on('sysmessage', data => {
            typeof options.sysmessage == 'function' && options.message(data)
        })
        //进入房间
        this.socket.on('enterRoom', data => {
            (typeof options.enterRoom == 'function') && options.enterRoom(data)
        })
        //离开房间
        this.socket.on('leaveRoom', data => {            
            typeof options.leaveRoom == 'function' && options.leaveRoom(data)            
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