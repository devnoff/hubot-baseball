3 Digit bulls and cows game for Hubot

휴봇 숫자야구 게임 모듈입니다


**지원 언어 Supporting Languages**

- 한국어 Korean
- 영어 English


**명령어 Default Commands**

`setLocalizedMessages` 함수를 통해 커스터마이징 가능합니다. 게임시작 명령의 키는 `start.cmd` 이고, 순위보기 명령의 키는 'show.ranking.cmd' 입니다. 
Able to customize commands with function `setLocalizedMessages` The key for starting game is `start.cmd` and `show.ranking.com` is for showing rankings.

- 게임시작 Start Game: '야구게임 시작', 'start bulls and cows' 
- 순위보기 Show Ranking: '야구게임 순위', 'show ranking'


**작동방법 How to play**

- 3자리의 숨겨진 숫자를 찾는 게임입니다. 
- 슬랙 채널에서 '야구게임 시작'을 치면 게임이 시작됩니다. 
- 3개의 연속된 숫자를 입력하면 회차가 카운팅되고 결과가 보여집니다. 
> ex) 
> 사용자입력:
> 123
>
> 봇 대답:
> 1회 [123] - 1S 1B

- 총 9회까지 진행됩니다


- This game is find 3 digit numbers which is hidden and genrated by bot. It would be started if you type 'start bulls and cows'. And if you input 3 different digit numbers, it returns result of the input. 
- If there is a number you input in the hidden numbers and also it matches the position, it returns S. And If the number is only exist and not matching position, it returns B. 
- You will have 9 chances to find correct number in a game.

> ex) 
> User input:
> 123
>
> Bot answer:
> 1st `123` - `1S` `1B`



v1.6.0
------

- 지역화(한국어,영어) 설정 지원(Support localization : en, ko[default])



v1.5.0
-------

- 설정(config) 프로퍼티 추가하여 Redis 저장 키값 변경 및 봇 메세지 지역화 가능하도록함
(Added configration property(config) for redis and i18n)


v1.4.0
-------

- redis 적용 (heroku 서버 재시동하여도 순위 정보 유지)
- 최소 이닝 순위 적용
- 기타 버그 수정
- 모듈 생성자 인터페이스 변경: redis_url 추가하여 { channel, text, user_name, send_handler, bot_name, redis_url } 을 생성자의 인자로 넘김



v1.3.0
-------

랭킹 시스템 도입



v1.2.0
------

모듈 생성자 인터페이스 변경:
{ channel, text, user_name, send_handler, bot_name } 을 생성자의 인자로 넘김






