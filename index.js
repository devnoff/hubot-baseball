const cache = require('memory-cache')
const _ = require('lodash')

/**
 * Hubot 숫자야구 모듈
 *
 * Created by Robinson Park 2017.11.30. 
 */

var Baseball = function(args){

  var channel = args.channel
  var text = args.text
  var user = args.user_name
  var send = args.send_handler
  var bot_name = args.bot_name
  var redis; /* Use redis for game data if exists, otherwise use fs */
  var key = 'baseball' + channel
  var baseball = cache.get(key)
  
  if (args.redis_url) {
    var Redis = require('ioredis');
    redis = new Redis(args.redis_url);
  }

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

    if (text.indexOf('야구게임 랭킹') > -1 || text.indexOf('야구게임 순위') > -1) {
      getRanking(function(err, rank){
        send(rank)
      });
      return true
    }
    
    if (text.indexOf('야구게임 시작') > -1) {
      if (baseball) {
        send('게임이 진행 중입니다')
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
          send(`<@${user}> 잘못된 번호에요. 같은 번호가 반복되었네요`)
          return true
        }

        // 지난 답변 검사
        var answers = baseball.answers
        for (var j in answers) {
          if (answers[j] == a) {
            send(`<@${user}> ${a}는 이미 답을 한 번호입니다`)
            return true
          }
        }

        // 숫자 분석
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
          this.applyForRank(user, false, times, function(){})
          this.reset()
          send(`아쉽게도 게임에 지셨네요 ㅠㅠ 답은 ${number} 입니다`) 
          return true
        }

        // 승리 판정
        var m = `제 ${times+1} 회 : \`${a}\` - `
        answers.push(a)
        if (s.length > 2 ) {
          this.applyForRank(user, true, times, function(){})
          this.reset()
          send(`정답 [${number}] 축하드립니다~ 승리하셨네요! 🎉🎉🎉`) 
          return true
        } 

        // 숫자 판정
        if (s.length < 1 && b.length < 1) {
          send(m + 'Out~!')
        } else {
          var r = []
          if (s.length > 0)
            r.push(`\`${s.length}S\``)

          if (b.length > 0)
            r.push(`\`${b.length}B\``)

          send(m + r.join(' '))
        }
        this.saveGame(baseball)

        return true
      } 
    }
    return false
  }

  this.saveGame = function(baseball){
    baseball.times++
    cache.put(key, baseball)
  }

  this.start = function() {
    var answers = []
    var number = generateNumber()
    var times = 0
    cache.put(key, {number, times, answers})
    send(`${bot_name}과 함께 하는 숫자야구⚾️ 게임~! 자 시작합니다~! 🙉`)
  }

  this.reset = function() {
    cache.put(key, null)
    cache.del(key)
  }

  const rank_file_path = __dirname + '/rank.json'

  var readFile = function(callback) {
    const fs = require('fs')

    fs.readFile(rank_file_path, 'utf8', function(err, data) {
      if (err) return callback(err, null)

      console.log(data)
      return callback(null, JSON.parse(data))
    })

  }

  var writeFile = function(data, callback) {
    const fs = require('fs')
    fs.writeFile(rank_file_path, JSON.stringify(data), 'utf8', function(err) {
      callback(err)
    });
  }

  var readRank = function(callback) {
    if (redis) {
      redis.get('ranking', function(err, data){
        callback(err, data ? JSON.parse(data) : null)
      });
    } else {
      readFile(callback)
    }
  }

  var writeRank = function(data, callback) {
    if (redis) {
      redis.set('ranking',JSON.stringify(data));
      callback(null)
    } else {
      writeFile(data, callback)
    }
  }


  this.applyForRank = function(user, isWin, times, callback) {

    readRank(function(err, data){

      var data = data ? data : []

      var index = _.findIndex(data, function(o) { return o.user == user })

      var user_data = index > -1 ? data[index] 
                      : { user: user, times: 0, wins: 0, loses: 0, min_times: 9999 }

      user_data.times += times
      user_data.wins += isWin ? 1 : 0
      user_data.loses += isWin ? 0 : 1
      
      // 최소이닝 
      var min = user_data.min_times
      user_data.min_times = min < times ? min : times
        


      if (index > -1)
        data[index] = user_data
      else
        data.push(user_data)

      writeRank(data, function(err){
        callback(err, data)
      })

    })
  }

  var getWinningRateRank = function(callback) {
    readRank(function(err, data){
      if (data) {
          data.sort(function(a, b){
            var aRate = a.wins / a.times
            var bRate = b.wins / b.times
            return aRate == bRate ? 0 : aRate > bRate ? 0 : 1
          })
      }

      callback(err, data)
    })
  }

  var getWinningsRank = function(callback) {
    readRank(function(err, data){
      if (data) {
        data.sort(function(a, b){
          return a.wins == b.wins ? 0 : (a.wins > b.wins ? 0 : 1)
        })
      }

      callback(err, data)
    })
  }

  this.getRanking = function(callback) {
    readRank(function(err, data){

      var result = ""
      var r = {rate:[], wins:[]}
      if (data) {

          // 정렬 for 승률
          data.sort(function(a, b){
            var aRate = a.wins / a.times
            var bRate = b.wins / b.times
            return aRate == bRate ? 0 : aRate > bRate ? 0 : 1
          })

          // 승률 순위
          result = "##이닝 수 대비 승률 순위## \n"
          for (var i = 0; i < data.length ; i++) {
            result = result.concat(`${i+1}등 <@${data[i].user}> 승: ${data[i].wins} / 이닝: ${data[i].times} / 승률: ${(parseFloat(data[i].wins) / parseFloat(data[i].times)).toFixed(3)} \n`)
          }
          
          // 정렬 for 최다승
          data.sort(function(a, b){
            return a.wins == b.wins ? 0 : (a.wins > b.wins ? 0 : 1)
          })

          // 최다승 순위
          result = result.concat('\n')
          result = result.concat('\n')
          result = result.concat("##최다승 순위## \n")
          for (var j = 0; j < data.length ; j++) {
            result = result.concat(`${j+1}등 <@${data[j].user}> 승: ${data[j].wins} / 패: ${data[j].loses} \n`)
          }

          // 정렬 for 최소 이닝
          data.sort(function(a, b){
            return a.min_times == b.min_times ? 0 : (a.min_times > b.min_times ? 1 : 0)
          })

          // 최소이닝 순위
          result = result.concat('\n')
          result = result.concat('\n')
          result = result.concat("##최소이닝 순위## \n")
          for (var j = 0; j < data.length ; j++) {
            result = result.concat(`${j+1}등 <@${data[j].user}> 최소이닝: ${parseInt(data[j].min_times) + 1} \n`)
          }


      } else {
        result = "데이터가 없습니다"
      }

      callback(err, result)
    })
  }


  return this
}

module.exports = Baseball