const cache = require('memory-cache')
const _ = require('lodash')


const _ordinals = {
  ko: ['1회','2회','3회','4회','5회','6회,','7회,','8회,','9회'],
  en: ['1st','2nd','3rd','4th','5th','6th,','7th,','8th,','9th'],
}

const _i18n = {
  ko: {
    'start.cmd': '야구게임 시작',
    'show.ranking.cmd': '야구게임 순위',
    'on.goin.msg' : '게임이 진행 중입니다',
    'wrong.number' : '잘못된 번호에요. 같은 번호가 반복되었네요',
    'number.exists' : '는 이미 답을 한 번호입니다',
    'you.lose' : '아쉽게도 게임에 지셨네요 ㅠㅠ 정답 : ',
    'you.win' : '은 정답입니다. 축하드립니다~ 승리하셨네요! 🎉🎉🎉',
    'start.msg' : '과 함께 하는 숫자야구⚾️ 게임~! 자 시작합니다~! 🙉',
    'winning.rate.ranking' : '*승률 순위*',
    'wins.ranking' : '*최다승 순위*',
    'less.inning.ranking' : '*최소이닝 순위*',
    'wins': '승',
    'winning.rate' : '승률',
    'losses' : '패',
    'inning' : '이닝',
    'less.inning' : '최소이닝',
    'no.data' : '데이터가 없습니다'
  },
  en: {
    'start.cmd': 'start bulls and cows',
    'show.ranking.cmd': 'show ranking',
    'on.goin.msg' : 'Game is on going',
    'wrong.number' : 'Wrong number (duplicated)',
    'number.exists' : 'has been tried already',
    'you.lose' : 'Unfortunately you did not find correct numbers. Correct Number is ',
    'you.win' : 'is Correct!. Configurations~! You won this game! 🎉🎉🎉 ',
    'start.msg' : "will lead the game! Let's get started 🙉",
    'winning.rate.ranking' : '*Winning Rate Raning*',
    'wins.ranking' : '*Wins Ranking*',
    'less.inning.ranking' : '*Minimum Innings Ranking*',
    'wins': 'Wins',
    'winning.rate' : 'Winning Rate',
    'losses' : 'Losses',
    'inning' : 'Inning',
    'less.inning' : 'Minimum',
    'no.data' : 'No data' 
  }
}

/**
 * Hubot 숫자야구 모듈 - 3 Digit Bulls and Cows Game Module for Hubot
 *
 * Created by Robinson Park 2017.11.30. 
 */

var Baseball = function(args){

  var _channel = args.channel
  var _text = args.text
  var _user = args.user_name
  var _send = args.send_handler
  var _bot_name = args.bot_name
  var _redis /* Use redis for game data if exists, otherwise use fs */
  var _key = 'baseball' + _channel
  var _baseball = cache.get(_key)
  
  if (args.redis_url) {
    var Redis = require('ioredis')
    _redis = new Redis(args.redis_url)
  }

  this.supportLocale = function() {
    return ['en','ko']
  }

  // Configurations for Redis and i18n
  var _config = {
    redis_key: 'ranking', // default
    locale: 'ko' // default
  }


  /* ----- Configurations Setting ----- */


  this.setLocale = function(locale) {
    _config.locale = locale
  }

  this.setRedisKey = function(key) {
    _config.redis_key = _key
  }

  this.addLocalizedMessages = function(locale, messages) {
    _i18n[locale] = messages
  }


  /* ----- Messages ----- */


  var msg = function(msg_key) {
    return _i18n[_config.locale][msg_key]
  }

  var ordinalStr = function(index) {
    return _ordinals[_config.locale][index]
  }

  //
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


  /* ----- Entry point ----- */


  this.check = function() {

    if (_text.indexOf(msg('show.ranking.cmd')) > -1) {
      getRanking(function(err, rank){
        _send(rank)
      });
      return true
    }
    
    if (_text.indexOf(msg('start.cmd')) > -1) {
      if (_baseball) {
        _send(msg('on.goin.msg'))
      } else {
        start()
      }
      return true
    }

    if (_baseball) {
      var number = _baseball.number
      var times = _baseball.times
      var a = /[0-9]{3}/.exec(_text)
      if (a) {
        // 답변 유효성 검사 - Validation number
        a = a[0]
        if (a[0] == a[1] || a[1] == a[2] || a[0] == a[2]) {
          _send(`<@${_user}> ${msg('wrong.number')}`)
          return true
        }

        // 지난 답변 검사 - Check previous answers
        var answers = _baseball.answers
        for (var j in answers) {
          if (answers[j] == a) {
            _send(`<@${_user}> ${msg('number.exists')} ${a}`)
            return true
          }
        }

        // 숫자 분석 - Analyze numbers
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

        // 회차 검사 - Check innings
        if (s.length < 3 && times > 7) {
          applyForRank(false, (times + 1), function(){})
          this.reset()
          _send(`${msg('you.lose')} ${number}`) 
          return true
        }

        // 승리 판정 - Judge win
        var m = `${ordinalStr(times)} : \`${a}\` - `
        answers.push(a)
        if (s.length > 2 ) {
          applyForRank(true, (times + 1), function(){})
          this.reset()
          _send(`[${number}] ${msg('you.win')}`) 
          return true
        } 

        // 숫자 판정 - Decode number
        if (s.length < 1 && b.length < 1) {
          _send(m + 'Out~!')
        } else {
          var r = []
          if (s.length > 0)
            r.push(`\`${s.length}S\``)

          if (b.length > 0)
            r.push(`\`${b.length}B\``)

          _send(m + r.join(' '))
        }
        this.saveGame(_baseball)

        return true
      } 
    }
    return false
  }


  /* ----- Game function ----- */


  this.saveGame = function(baseball){
    baseball.times++
    cache.put(_key, baseball)
  }

  var start = function() {
    var answers = []
    var number = generateNumber()
    var times = 0
    cache.put(_key, {number, times, answers})
    _send(`${_bot_name}${msg('start.msg')}`)
  }

  this.reset = function() {
    cache.put(_key, null)
    cache.del(_key)
  }


  /* ---- Rankings ----- */
  

  this.resetRanking = function() {
    writeRank('', function() {})
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
    if (_redis) {
      _redis.get(_config.redis_key, function(err, data){
        callback(err, data ? JSON.parse(data) : null)
      });
    } else {
      readFile(callback)
    }
  }

  var writeRank = function(data, callback) {
    if (_redis) {
      _redis.set(_config.redis_key, JSON.stringify(data));
      callback(null)
    } else {
      writeFile(data, callback)
    }
  }


  var applyForRank = function(isWin, times, callback) {

    readRank(function(err, data){

      var data = data ? data : []

      var index = _.findIndex(data, function(o) { return o.user == _user })

      var user_data = index > -1 ? data[index] 
                      : { user: _user, times: 0, wins: 0, loses: 0, min_times: 9999 }

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

          // 정렬 for 승률 - sort for winning rate
          data.sort(function(a, b){
            var aRate = a.wins / a.times
            var bRate = b.wins / b.times
            return aRate == bRate ? 0 : aRate > bRate ? 0 : 1
          })

          // 승률 순위 - winning rate ranking
          result = `${msg('winning.rate.ranking')} \n`
          for (var i = 0; i < data.length ; i++) {
            result = result.concat(`[${i+1}] <@${data[i].user}> - ${msg('wins')}: ${data[i].wins} / ${msg('inning')}: ${data[i].times} / ${msg('winning.rate')}: ${(parseFloat(data[i].wins) / parseFloat(data[i].times)).toFixed(3)} \n`)
          }
          
          // 정렬 for 최다승 - sort for most wins
          data.sort(function(a, b){
            return a.wins == b.wins ? 0 : (a.wins > b.wins ? 0 : 1)
          })

          // 최다승 순위 - most wins ranking
          result = result.concat('\n')
          result = result.concat(`${msg('wins.ranking')} \n`)
          for (var j = 0; j < data.length ; j++) {
            result = result.concat(`[${j+1}] <@${data[j].user}> - ${msg('wins')}: ${data[j].wins} / ${msg('losses')}: ${data[j].loses} \n`)
          }

          // 정렬 for 최소 이닝 - sort for min innings
          data.sort(function(a, b){
            return a.min_times == b.min_times ? 0 : (a.min_times > b.min_times ? 1 : 0)
          })

          // 최소이닝 순위 - minimum innings ranking
          result = result.concat('\n')
          result = result.concat(`${msg('less.inning.ranking')} \n`)
          for (var j = 0; j < data.length ; j++) {
            result = result.concat(`[${j+1}] <@${data[j].user}> - ${msg('less.inning')}: ${data[j].min_times} \n`)
          }


      } else {
        result = msg('no.data')
      }

      callback(err, result)
    })
  }


  return this
}

module.exports = Baseball