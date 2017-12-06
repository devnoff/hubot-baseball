3 Digit bulls and cows game for Hubot

휴봇 숫자야구 게임 모듈입니다


**명령어**

- 게임시작: '야구게임 시작'
- 순위보기: '야구게임 순위'


**작동방법**

- 슬랙 채널에서 '야구게임 시작'을 치면 게임이 시작됩니다.
- 3개의 연속된 숫자를 입력하면 회차가 카운팅되고 결과가 보여집니다
> ex) 
> 사용자입력:
> 123
>
> 봇 대답:
> 1회 [123] - 1S 1B

- 총 9회까지 진행됩니다


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






