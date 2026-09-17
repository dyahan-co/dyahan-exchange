# Поток данных и архитектурная схема

## Контейнеры системы

```mermaid
flowchart LR
    U[Браузер пользователя]
    CDN[Static hosting / CDN]
    FE[React + Redux Toolkit]
    WW[Web Worker\nагрегация графика]
    WA[Canvas / WebGL / WebAudio]
    NG[NestJS Gateway\nBFF + WebSocket + auth edge]
    JB[Spring Boot Core API\nигры + P2P + кредит]
    PG[(PostgreSQL\nusers + ledger + orders)]
    RD[(Redis\nsessions + matchmaking + pub/sub)]
    OBJ[(Object storage\nмемы + нейрослоп)]
    AI[AI Adapter\nrewrite / image pool]
    JOB[Scheduler\nсроки кредита]
    OBS[Sentry]
    AN[Яндекс.Метрика]

    U --> CDN --> FE
    FE <--> WW
    WW --> WA
    FE -- HTTPS JSON --> NG
    FE <--> |WSS events| NG
    NG -- REST/OpenAPI --> JB
    NG <--> RD
    JB --> PG
    JB <--> RD
    JB --> OBJ
    JB --> AI
    JOB --> JB
    FE -. ошибки .-> OBS
    NG -. ошибки .-> OBS
    JB -. ошибки .-> OBS
    FE -. обезличенные события .-> AN
```

## Владение данными

| Данные | Источник истины | Почему |
|---|---|---|
| пользователь, роли, статус | Spring/PostgreSQL | нельзя доверять клиенту |
| баланс и долг | append-only ledger в PostgreSQL | аудит и атомарные выплаты |
| P2P-ордер и резерв | Spring/PostgreSQL | защита от double spend |
| активная дуэль, presence | Redis + периодический snapshot | быстрое live-состояние и reconnect |
| изображения мемов/слопа | object storage; в БД только metadata | большие бинарные объекты отдельно |
| график в UI | Redux cache + Web Worker | быстрый render; сервер присылает события |
| настройки звука/P2P-режима | localStorage | локальное предпочтение, не ценное состояние |

Баланс хранится не одним изменяемым числом, а суммой неизменяемых записей ledger: `GAME_REWARD`, `ROULETTE_WIN`, `ROULETTE_LOSS`, `P2P_HOLD`, `P2P_SETTLEMENT`, `LOAN_ISSUED`, `LOAN_REPAID`. Каждая операция имеет `idempotencyKey`.

## Критический поток: слоп-угадайка

```mermaid
sequenceDiagram
    actor Player as Игрок
    participant UI as React UI
    participant GW as NestJS gateway
    participant Core as Spring Games
    participant DB as PostgreSQL
    participant Store as Object storage

    Player->>UI: Начать раунд
    UI->>GW: POST /guess-rounds
    GW->>Core: createRound(userId)
    Core->>DB: reserve prompt + deadline
    Core->>Store: sign image URL
    Core-->>UI: roundId + imageUrl + expiresAt
    Player->>UI: Отправить ответ
    UI->>GW: POST /guess-rounds/{id}/answers + idempotency key
    GW->>Core: checkAnswer(...)
    Core->>DB: lock round, fuzzy match, append reward, close round
    DB-->>Core: result + authoritative balance
    Core-->>UI: score + outcome + balance
```

Скрытое название, словарь допустимых синонимов и точный порог совпадения клиенту не отправляются. До закрытия раунда ответы не попадают в аналитику и логи браузера.

## Критический поток: real-time дуэль

```mermaid
sequenceDiagram
    participant A as Игрок A
    participant G as NestJS WS
    participant R as Redis
    participant C as Spring Core
    participant B as Игрок B / зрители

    A->>G: duel:queue
    B->>G: duel:queue
    G->>R: atomic match
    G-->>A: duel:started(serverDeadline)
    G-->>B: duel:started(serverDeadline)
    A->>G: duel:answer
    B->>G: duel:answer / votes
    G->>R: publish events
    G->>C: settle duel(idempotencyKey)
    C-->>G: winner + balance changes
    G-->>A: duel:settled
    G-->>B: duel:settled
```

## Переписывание сообщения в P2P-стиль

1. Исходный текст остаётся в поле ввода.
2. Gateway применяет rate limit и передаёт текст AI adapter-у.
3. Клиент получает **предпросмотр**, чтобы пользователь подтвердил или отредактировал формулировку.
4. В чат отправляется только подтверждённый текст. Секреты и запрещённые категории блокируются до публикации.
5. При недоступности AI пользователь может отправить исходный текст — чат не блокируется внешним сервисом.

## Контракты первой вертикали

- `POST /auth/demo` — создать временного игрока.
- `GET /me` — профиль, статус, доступный/зарезервированный баланс.
- `POST /guess-rounds` — начать раунд.
- `POST /guess-rounds/{id}/answers` — проверить ответ и вернуть settlement.
- `GET /market/candles?interval=...` — начальный ряд графика.
- `WS /live` — `price.tick`, `balance.changed`, `duel.*`, `order.*`.

OpenAPI является контрактом HTTP API и источником генерации TypeScript/Java моделей. События WebSocket версионируются отдельно (`eventVersion`).
