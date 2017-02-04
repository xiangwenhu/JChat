define(function (require, exports, module) {

    class Notify {

        constructor() {
            this.supported = window.Notification != null
            this.options = {
                renotify:true,
                noscreen:false,
                tag:'jchat'
            }
            this.hiddenKey = Notify.getWindowHiddenKey()           
        }

        popNotify(title, options) {
            let opt = Object.assign({}, this.options, options)
            if (Notification.permission == 'granted') {
                var notification = new Notification(title, opt)
                notification.onclick = function () {
                    notification.close()
                }
            }
        }

        pop(title, options) {
            //若是支持并且隐藏，弹出消息
            if (this.supported && document[this.hiddenKey]) {
                if (Notification.permission == 'granted') {
                    this.popNotify(title, options)
                } else if (Notification.permission != 'denied') {
                    Notification.requestPermission(() => {
                        this.popNotify(title, options)
                    })
                }
            }
        }

        static getWindowHiddenKey() {
            if (typeof document.hidden !== 'undefined') {
                this.hiddenKey = 'hidden'
            } else if (typeof document.mozHidden !== 'undefined') {
                this.hiddenKey = 'mozHidden'
            } else if (typeof document.msHidden !== 'undefined') {
                this.hiddenKey = 'msHidden'
            } else if (typeof document.webkitHidden !== 'undefined') {
                this.hiddenKey = 'webkitHidden'
            }
            return this.hiddenKey
        }
    }

    module.exports = Notify
})