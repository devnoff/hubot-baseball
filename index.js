const cache = require('memory-cache')


/**
 * Hubot 숫자야구 모듈
 *
 * Created by Robinson Park 2017.11.30. 
 */
var Baseball = function(/* 봇 메세지 객체 */msg, /* 콜백 (msg, text) */send, botName){
  var baseball = cache.get('baseball')
  var msg = msg
  var text = msg.text

  var generateNumber = function() {
    var r = []
    var n = [0,1,2,3,4,5,6,7,8,9]
    var i = Math.floor(Math.random() * n.length)

    for (var j = 0; j < 3; j++) {
      r.push(n[i])
      n.splice(i, 1)
      i = Math.floor(Math.random() * n.length)
    } 

    return r.join('')
  }

  this.check = function() {
    
    if (text.indexOf('야구게임 시작') > -1) {
      if (baseball) {
        send(msg, '게임이 진행 중입니다')
      } else {
        this.start()
      }
      return true
    }

    if (baseball) {
      var number = baseball.number
      var times = baseball.times
      var a = /[0-9]{3}/.exec(text)
      if (a) {
        // 답변 유효성 검사
        a = a[0]
        if (a[0] == a[1] || a[1] == a[2] || a[0] == a[2]) {
          send(msg, `<@${msg.user}> 잘못된 번호에요. 같은 번호가 반복되었네요`)
          return true
        }

        // 지난 답변 검사
        var answers = baseball.answers
        for (var j in answers) {
          if (answers[j] == a) {
            send(msg, `<@${msg.user}> ${a}는 이미 답을 한 번호입니다`)
            return true
          }
        }

        // 숫자 판정
        var s = []
        var b = []
        for (var i = 0; i < a.length; i++) {

          if (number.includes(a[i])) {
            if (number[i] == a[i]) {
              s.push(a[i])
            } else {
              b.push(a[i])
            }
          }
        }

        // 회차 검사
        if (s.length < 3 && times > 7) {
          this.reset()
          send(msg, `아쉽게도 게임에 지셨네요 ㅠㅠ 답은 ${number} 입니다`) 
          return true
        }

        // 결과 전송
        var m = `제 ${times+1} 회 [${a}] : `
        answers.push(a)
        if (s.length > 2 ) {
          this.reset()
          send(msg, `정답 [${number}] 축하드립니다~ 승리하셨네요! 🎉🎉🎉`) 
        } else if (s.length < 1 && b.length < 1) {
          send(msg, m + 'Out~!')
        } else {
          var r = []
          if (s.length > 0)
            r.push(`${s.length}S`)

          if (b.length > 0)
            r.push(`${b.length}B`)

          send(msg, m + r.join(' '))
        }
        this.saveGame(baseball)

        return true
      } 
    }
    return false
  }

  this.saveGame = function(baseball){
    baseball.times++
    cache.put('baseball', baseball)
  }

  this.start = function() {
    var answers = []
    var number = generateNumber()
    var times = 0
    cache.put('baseball', {number, times, answers})
    send(msg, `${botName}과 함께 하는 수자야구⚾️ 게임~! 자 시작합니다~! 🙉`)
  }

  this.reset = function() {
    cache.put('baseball', null)
  }


  return this
}

module.exports = Baseball