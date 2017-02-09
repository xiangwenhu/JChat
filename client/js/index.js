define(function (require) {

    require('/js/adapter.js')
    const WebRTC = require('/js/webrtc.js')
    const Chat = require('/js/chat.js')
    const Notify = require('/js/notify.js')


    class JChartClient {
        constructor() {
            this.containsEl = document.querySelector('#container')
            this.allClientsEl = this.containsEl.querySelector('#allClients')
            this.slidesEl = this.containsEl.querySelectorAll('.slide')
            this.inputContentEl = this.containsEl.querySelector('#inputContent')
            this.btnSendEl = this.containsEl.querySelector('#btnSend')
            this.msgContentEl = this.containsEl.querySelector('#msgContent')
            this.membersEl = this.containsEl.querySelector('#members')
            this.btnVideoEl = this.containsEl.querySelector('#btnVideo')
            this.videoContentEl = this.containsEl.querySelector('#videoContent')
            this.btnClearEl = this.containsEl.querySelector('#btnClear')
            this.chatClientEl = this.containsEl.querySelector('.chatClient')
            this.emojiwrapperEl = this.containsEl.querySelector('#emojiWrapper')
            this.dialogEl = document.querySelector('#prompt_dialog')

            this.videoChat = false
            //初始化聊天
            this.chat = new Chat()
            this.notify = new Notify(true)
            this.rtc = null

            this.initialEmoji()
        }


        start() {
            this.chat.init({
                allClients(data) {
                    this.allClientsEl.innerHTML = Object.keys(data).map((p) => {
                        let cls = p == this.chat.id ? 'me' : ''
                        return `<li data-id='${p}' class=${cls}>${data[p]}</li>`
                    }
                    ).join('')
                },
                enterRoom(data) {
                    this.slideTo('chat')
                    this.chatClientEl.innerHTML = data.targetName
                },
                message(data) {
                    this.dispayMessage(data)

                    this.notify.pop('新消息', {
                        body: `您有一条来自${data.from}的新消息，请注意查收`
                    })
                },
                sysmessage(data) {
                    this.msgContentEl.innerHTML += '<br/>' + data
                    this.msgContentEl.scrollTop = this.msgContentEl.scrollHeight
                },
                initCallback(socket) {
                    this.rtc = new WebRTC({
                        socket: socket
                    })
                    this.rtc.init()
                }
            }, this)

            this.registerEvents()
        }

        registerEvents() {
            //选择client
            this.allClientsEl.addEventListener('click', ev => {
                let el = ev.target
                if (el.tagName == 'LI' && !el.classList.contains('me') && !el.classList.contains('selected')) {
                    Array.from(el.parentElement.children).forEach(el => el.classList.remove('selected'))
                    el.classList.add('selected')
                    this.chatClientEl.innerHTML = el.textContent
                    this.slideTo('chat')
                    this.chat.enterRoom(el.getAttribute('data-id'))
                }
            })

            //发送消息
            this.inputContentEl.addEventListener('keydown', ev => {
                if (ev.keyCode == 13) {
                    ev.preventDefault()
                    let msg = this.inputContentEl.innerHTML
                    if (msg) {
                        this.dispayMessage({
                            from: '[__me__]',
                            message: msg
                        })
                        this.chat.message(msg)
                        this.inputContentEl.innerHTML = ''
                    }
                }
            })
            //发送消息
            this.btnSendEl.addEventListener('click', () => {
                let msg = this.inputContentEl.innerHTML
                if (msg) {
                    this.dispayMessage({
                        from: '[__me__]',
                        message: msg
                    })
                    this.chat.message(msg)
                    this.inputContentEl.innerHTML = ''
                }
            })

            //视频聊天
            this.btnVideoEl.addEventListener('click', () => {
                if (!this.videoChat) {
                    this.btnVideoEl.value = '关闭视频'
                    this.videoContentEl.style.display = 'block'
                    this.rtc.init()
                    this.rtc.start(this.chat.roomId)
                } else {
                    this.btnVideoEl.value = '视频聊天'
                    //msgContentEl.style.height = '300px'
                    //videoContentEl.style.display = 'none'
                    this.rtc.stop(null, true)
                }
                this.videoChat = !this.videoChat
            })

            //清空
            this.btnClearEl.addEventListener('click', () => {
                this.msgContentEl.innerHTML = ''
            })

            //切换Tab
            this.containsEl.querySelector('.head-tab').addEventListener('click', ev => {
                let el = ev.target
                if (el.tagName == 'LABEL') {
                    this.slideTo(el.getAttribute('data-tab'))
                }
            })

            //显示emoji
            document.getElementById('btnEmoji').addEventListener('click', ev => {
                this.emojiwrapperEl.style.display = 'block'
                ev.stopPropagation()
            })

            //点击别处，隐藏emoji
            document.body.addEventListener('click', ev => {
                if (ev.target != this.emojiwrapperEl) {
                    this.emojiwrapperEl.style.display = 'none'
                }
                if (ev.target != this.dialogEl) {
                    this.dialogEl.style.display = 'none'
                }
            })

            //选择emoji
            document.getElementById('emojiWrapper').addEventListener('click', ev => {
                var target = ev.target
                if (target.nodeName.toLowerCase() == 'img') {
                    this.dispayMessage({
                        from: '[__me__]',
                        message: '[emoji:' + target.title + ']'
                    })
                    this.chat.message('[emoji:' + target.title + ']')
                }
            }, false)


            //粘贴功能
            this.inputContentEl.addEventListener('paste', (ev) => {
                var items = (ev.clipboardData || ev.originalEvent.clipboardData).items
                for (let index in items) {
                    var item = items[index]
                    if (FileReader && item.kind === 'file' && item.type.indexOf('image') === 0) {
                        var blob = item.getAsFile()
                        var reader = new FileReader()
                        reader.onload = (ev) => {
                            let pic = document.createElement('img')
                            pic.src = ev.target.result
                            this.appendInputMeesage(pic)
                        }
                        reader.readAsDataURL(blob)
                        break
                    }
                }
            })


            //图片放大查看
            this.msgContentEl.addEventListener('dblclick', (ev) => {
                let el = ev.target
                if (el.tagName.toUpperCase() == 'IMG') {
                    this.displayOriginImage(el)
                }
            })

        }

        slideTo(tag) {
            //tab切换
            this.containsEl.querySelectorAll('.rooms-title').forEach((tab) => tab.classList.contains(`head-tab-${tag}`) ? tab.classList.add('selected') : tab.classList.remove('selected'))
            //slide切换
            this.slidesEl.forEach((slide) => slide.classList.contains(`slide-${tag}`) ? slide.style.display = 'block' : slide.style.display = 'none')
        }

        initialEmoji() {
            var emojiContainer = document.getElementById('emojiWrapper'),
                docFragment = document.createDocumentFragment()
            for (var i = 69; i > 0; i--) {
                var emojiItem = document.createElement('img')
                emojiItem.src = '/img/emoji/' + i + '.gif'
                emojiItem.title = i
                docFragment.appendChild(emojiItem)
            }
            emojiContainer.appendChild(docFragment)
        }

        dispayMessage(data) {
            let msgToDisplay = document.createElement('p'),
                date = new Date().toTimeString().substr(0, 8),
                fromC = data.from, msg

            //me替换    
            if (data.from == '[__me__]') {
                msgToDisplay.classList = fromC = 'me'
            }
            msg = this.showEmoji(data.message)
            msgToDisplay.innerHTML = `${fromC}(${date})：${msg}`


            this.msgContentEl.appendChild(msgToDisplay)
            this.msgContentEl.scrollTop = this.msgContentEl.scrollHeight
        }

        appendInputMeesage(content) {
            this.inputContentEl.appendChild(content)
        }


        showEmoji(msg) {
            var match, result = msg,
                reg = /\[emoji:\d+\]/g,
                emojiIndex,
                totalEmojiNum = this.emojiwrapperEl.children.length
            while (match = reg.exec(msg)) {
                emojiIndex = match[0].slice(7, -1)
                if (emojiIndex > totalEmojiNum) {
                    result = result.replace(match[0], '[X]')
                } else {
                    result = result.replace(match[0], '<img class="emoji" src="/img/emoji/' + emojiIndex + '.gif" />')
                }
            }
            return result
        }

        displayOriginImage(image) {
            let pos = this.getPosition(), pic = document.createElement('img')
            pic.src = image.src
            this.dialogEl.innerHTML = ''
            this.dialogEl.appendChild(pic)
            this.dialogEl.style.display = 'block'
            this.dialogEl.style.left = (pos.width - (pic.clientWidth > pos.width * 0.75 ? pos.width * 0.75 : pic.clientWidth)) / 2 + 'px'
            this.dialogEl.style.top = (pos.height - (pic.clientHeight > pos.height * 0.75 ? pos.height * 0.75 : pic.clientHeight)) / 2 + 'px'
            pic.style.maxHeight = pos.height * 0.75 + 'px'
            pic.style.maxWidth = pos.width * 0.75 + 'px'

        }

        getPosition() {
            var top, left, height, width, h, w
            if (document.compatMode && document.compatMode != 'BackCompat') {
                top = document.documentElement.scrollTop
                left = document.documentElement.scrollLeft
                height = document.documentElement.clientHeight
                width = document.documentElement.clientWidth
                h = document.documentElement.scrollHeight
                w = document.documentElement.scrollWidth
            } else {
                top = document.body.scrollTop
                left = document.body.scrollLeft
                height = document.body.clientHeight
                width = document.body.clientWidth
                h = document.body.scrollHeight
                w = document.body.scrollWidth
            }
            if (h < height) {
                h = height
                w = width
            }
            return { top: top, left: left, height: height, width: width, h: h, w: w, sw: window.screen.width, sh: window.screen.height }
        }
    }


    (new JChartClient()).start()

})



