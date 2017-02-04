define(function (require, exports, module) {

    class Notify {

        constructor(alwaysShow = false) {
            this.supported = window.Notification != null
            this.options = {
                renotify: true,
                noscreen: false,
                tag: 'jchat',
                icon: '/img/notify_title.jpg'
            }
            this.hiddenKey = Notify.getWindowHiddenKey()
            this.alwaysShow = alwaysShow || false
            this.manualClosed = false
        }

        popNotify(title, options) {
            let opt = Object.assign({}, this.options, options)
            if (Notification.permission == 'granted') {
                var notification = new Notification(title, opt)
                this.initalizeNotification(notification, title, opt)
            }
        }

        initalizeNotification(notification, title, options) {
            notification.onclick = () => {
                //返回消息窗口
                //关闭消息框
                this.manualClosed = true
                notification.close()
                window.focus()
            }

            notification.onclose = () => {
                if (document[this.hiddenKey] && this.alwaysShow && !this.manualClosed) {
                    this.manualClosed = false
                    notification = new Notification(title, options)
                    this.initalizeNotification(notification, title, options)
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