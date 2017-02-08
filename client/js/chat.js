define(function (require, exports, module) {

    const util = require('/js/util.js')

    class Chat {
        constructor(url) {
            this.socketUrl = url || 'https://' + location.host
            this.rooms = []   //所在房间   
            this.socket = null
            this.id = null
            this.roomId = null    //房间id
            this.targetName = null
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
                    case 'enterRoom':
                        this.roomId = data.roomId
                        this.targetName = data.targetName
                        typeof options[type] == 'function' && options[type](data)
                        break
                    case 'allClients':
                    case 'message':
                    case 'sysmessage':
                        typeof options[type] == 'function' && options[type](data)
                        break
                    default:
                        break
                }
            })

            options.initCallback && options.initCallback(this.socket)
        }
        //进入房间
        enterRoom(targetId) {
            this.roomId = util.uuid()
            this.socket.emit('chat', 'enterRoom', { targetId, roomId: this.roomId })
        }
        //消息
        message(msg) {
            this.socket.emit('chat', 'message', { roomId: this.roomId, message: msg })
        }
    }

    module.exports = Chat

})