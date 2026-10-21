# Связь экранов, API и модулей

HTTP пути ниже относительно `/api/v1`. Полные DTO — в [openapi.json](openapi.json). UI-события не меняют деньги напрямую; серверный snapshot — окончательный результат.

| Экран / действие | HTTP | Core-модуль и данные | Событие / правило приёмки |
|---|---|---|---|
| U01 публичный терминал | GET market/candles, orders, shame | market / p2p / loans | price.tick; не требует аккаунта |
| U02 вход / регистрация / демо | GET auth/csrf; POST auth/login / register / demo | identity: users, sessions | HttpOnly cookie; неверный пароль → 401 |
| U03 онбординг | GET me; переход к игре | identity; UI-state | Пропуск не блокирует вход в терминал |
| U04 терминал | GET me, wallet, wallet/ledger | identity / wallet | balance.changed только владельцу |
| U05–06 угадайка | POST guess-rounds; POST guess-rounds/{id}/answers | guess / wallet: round + journal + postings | +1 единожды; повтор с тем же ключом без награды |
| U07 рулетка | POST roulette-rounds; GET {id}/reveal | roulette / wallet: secret_result, nonce, hold | Результат фиксируется до анимации; один расчёт |
| U08 очередь | POST duel-queue; GET {id}; POST {id}/cancel | duels / wallet; Redis queue | 60 секунд → возврат hold |
| U09 ответ дуэли | GET duels/{id}; POST {id}/answers | duels: participants / answers | duel.updated; чужой ответ скрыт до VOTING |
| U10 зритель | POST duels/{id}/votes / bets | duels / wallet: votes / bets / holds | Один голос; bet до reveal; игрок не голосует |
| U11 итог | GET duels/{id}, wallet | duels / wallet: settlement | duel.settled; нет голосов → возврат всем |
| U12 стакан | GET orders?side=… | p2p: orders | order.updated; список публичный |
| U13 заявка | POST orders; POST orders/{id}/cancel | p2p / wallet: order + hold | Недостаток любого актива → rollback |
| U14 сделка | POST orders/{id}/accept; GET deals/{id}; POST confirm / cancel | p2p / wallet: deal + confirmations + postings | Два concurrent accept → один buyer; два confirm → один расчёт |
| U15 чат | POST chat/rewrite; GET/POST chat/rooms/{roomId}/messages | chat / moderation / AI adapter | chat.message; AI-preview не публикуется автоматически |
| U16 кредит | POST loans | loans / wallet: loan + postings | Ноль доступного KUM, нет reserves/ACTIVE loan |
| U17 погашение | GET loans/{id}; POST {id}/repay | loans / wallet | До dueAt → REPAID, после → OVERDUE |
| U18 доска | GET shame; GET me | loans / identity / shame_entry | loan.overdue; SCAM не удаляет аккаунт |
| U19 профиль | GET me, wallet/ledger; POST auth/logout, me/demo-reset | identity / wallet | Чужие операции не выдаются; reset только demo |
| U20 модерация | GET moderation/reports; POST {id}/resolve | moderation: report + moderation_action | Только MODERATOR; причина обязательна |
| U21 отзывы | GET reviews; POST reviews/{id}/like; POST reports | reviews / moderation | synthetic=true; одна реакция user/target |
| Upload в U07 | POST media/uploads; signed PUT; POST media/{id}/complete | media + S3: metadata / object | Нет READY до декодирования и проверки файла |

## Матрица протоколов

| Источник → получатель | Протокол / формат | Назначение |
|---|---|---|
| Browser → Nginx | HTTPS / HTML, CSS, JS | Загрузка SPA и assets |
| React → NestJS | HTTPS REST / JSON | Команды и snapshots, session cookie + CSRF |
| React ↔ NestJS | WSS / JSON envelope | Live-подписки и события; Native WebSocket |
| React ↔ Worker | Browser postMessage / structured clone | Агрегация ценовых точек вне UI-thread |
| NestJS → Spring | HTTP REST / JSON внутри compose; service JWT | Доменная команда и проверка сессии; production TLS при недоверенной сети |
| Spring → PostgreSQL | JDBC / PostgreSQL wire protocol | Транзакции, read/write доменных таблиц |
| Spring / NestJS ↔ Redis | RESP / PubSub | Cache, presence, queue, fanout |
| Spring → MinIO/S3 | S3-compatible API / HTTP(S) | Signed URLs, metadata, проверка загрузок |
| Browser → Object Storage | HTTPS signed GET / PUT | Изображение без доступа к secret key |
| Spring → AI provider | HTTPS / JSON | Опциональный rewrite, 5s timeout; mock по умолчанию |
| SDK → Sentry | HTTPS | Ошибки и requestId без содержимого чата/секретов |
| Browser → Метрика | HTTPS | Неперсональные продуктовые события |

## Каталог серверных событий

| Type | Producer | Subscriber | Payload / восстановление |
|---|---|---|---|
| price.tick | market | public market | Курс и serverTime; при разрыве GET candles |
| balance.changed | wallet / outbox | private me | Accounts и версии; GET wallet |
| duel.updated | duels / outbox | duel:{id} | Статус, snapshotRequired; GET duel, ответы фильтруются сервером |
| duel.settled | duels / outbox | duel:{id} | Итог; личный баланс отдельным private event |
| order.updated | p2p / outbox | public market / order:{id} | ID, статус; приватные confirmations только GET deal участникам |
| chat.message | chat / outbox | room:{id} | Подтверждённый текст; membership для закрытой комнаты |
| loan.overdue | loans / outbox | private me | ID долга, dueAt, SCAM; повторное чтение me |
| subscribed / pong / error | gateway | конкретное соединение | Управление соединением, не доменные изменения |

Все доменные события получают ID и aggregateVersion. Gateway control events используют connection ID как aggregateId и локальный счётчик. Redis PubSub не гарантирует replay: версии обнаруживают пропуски, HTTP snapshot восстанавливает актуальное состояние.
