# Экраны, API и модули

Используем схему из [architecture.md](architecture.md): React → NestJS Gateway → Spring Boot Core → общая PostgreSQL. Делим Core на модули, не запускаем отдельные Identity/Economy/Games/Community.

Все HTTP-пути ниже указываем относительно /api/v1. Через Gateway принимаем запросы и передаём их в Core. Финансовые действия выполняем в Core одной транзакцией с Wallet, журналом и outbox.

## 1. Экран → действие → данные

| Экран | HTTP | Модули и данные | Что проверяем |
|---|---|---|---|
| U01 публичный терминал | GET market/candles, orders, shame | market, p2p, loans | Открываем публичные данные без входа; обновляем курс через price.tick |
| U02 вход / демо; U02R регистрация | GET auth/csrf; POST auth/login, auth/register, auth/demo | identity: users, sessions; wallet: accounts | Создаём аккаунт и счета в общей БД, выдаём HttpOnly cookie; при неверном пароле возвращаем 401 |
| U03 первое знакомство | GET me | identity; UI-state | Получаем профиль, разрешаем пропустить онбординг |
| U04 терминал и баланс | GET me, wallet, wallet/ledger | identity, wallet: accounts, holds, journal_transactions, postings | Показываем серверный баланс и историю только владельцу |
| U05 начало угадайки | POST guess-rounds | guess, media: guess_rounds, answer_secrets, media_objects | Выдаём roundId, картинку и expiresAt без скрытого ответа |
| U05–U06 ответ | POST guess-rounds/{id}/answers | guess + wallet | Одной tx закрываем раунд, при верном ответе начисляем +1 KUM и сохраняем outbox; повтор не оплачиваем |
| U07 рулетка | POST roulette-rounds; GET roulette-rounds/{id}/reveal | roulette + wallet: secret_result, nonce, commit_hash, hold, ledger | До анимации фиксируем исход и резерв 2 KUM; для 1–5 даём net +2, для 6–10 net −2; GET только читает |
| U08 лобби дуэли | POST duel-queue; GET duel-queue/{id}; POST duel-queue/{id}/cancel | duels + wallet; queue entry в PostgreSQL, ускорение в Redis | Резервируем 5 KUM, после 60 секунд без пары/отмены освобождаем резерв один раз |
| U09 ответ дуэли | GET duels/{id}; POST duels/{id}/answers | duels: participants, answers, deadlines | Проверяем участника, сохраняем ответ до deadline, не раскрываем чужой ответ до VOTING |
| U10 зритель: ставка | POST duels/{id}/bets | duels + wallet: bets, holds | Принимаем одну ставку 1–100 KUM до reveal, не принимаем от игроков; фазу и резерв проверяем одной tx |
| U10 зритель: голос | POST duels/{id}/votes | duels: votes | Принимаем один голос неучастника только в VOTING за участника этого матча |
| U11 итог дуэли | GET duels/{id}, wallet | duels + wallet: settlement, ledger | Одной tx сохраняем итог и расчёт; при ничьей/нуле голосов возвращаем банк и ставки |
| U12 P2P-стакан | GET orders?side=… | p2p: p2p_orders | Выдаём публичный список; не связываем цену заявки автоматически с графиком |
| U13 новая заявка | POST orders; POST orders/{id}/cancel | p2p + wallet: order, hold | Создаём заявку и резерв одной tx; не разрешаем тратить резерв повторно |
| U14 принятие и сделка | POST orders/{id}/accept; GET deals/{id}; POST deals/{id}/confirm, deals/{id}/cancel | p2p + wallet: deals, confirmations, holds, postings | Принимаем одного контрагента, проверяем две стороны, атомарно обмениваем обе валюты; до расчёта cancel/5 минут → возврат |
| U15 чат и предпросмотр | POST chat/rewrite; GET/POST chat/rooms/{roomId}/messages | chat, moderation, RewriteProvider | Проверяем статус и комнату; публикуем только подтверждённый текст; при timeout AI оставляем обычную отправку |
| U16 кредит | POST loans | loans + wallet: loan, ledger, accounts | При нуле доступного KUM, без долга/резервов выдаём 10 KUM под 0% на 24 часа одной tx |
| U17 погашение | GET loans/{id}; POST loans/{id}/repay | loans + wallet | Принимаем полное погашение до dueAt; repay/overdue защищаем lock одной loan |
| U18 доска позора | GET shame; GET me | loans, identity: shame_entries, users.status | Одной tx записываем OVERDUE, SCAM и доску; сохраняем вход, историю и публичный просмотр |
| U19 профиль и история | GET me, wallet/ledger; POST auth/logout, me/demo-reset | identity, wallet, games, loans | Не выдаём чужие операции; отзываем сессию при logout; reset разрешаем только demo-owner после закрытия обязательств |
| U20 модерация | GET moderation/reports; POST moderation/reports/{id}/resolve | moderation: reports, moderation_actions | Проверяем MODERATOR, требуем причину, сохраняем аудит без изменения ledger |
| U21 отзывы | GET reviews; POST reviews/{id}/like; POST reports | reviews, moderation: reviews, reactions, reports | Помечаем истории synthetic=true; принимаем одну реакцию на user/review |
| Изображение / мем | POST media/uploads; signed PUT; POST media/{id}/complete | media + S3: metadata, object | Разрешаем READY только после декодирования и проверки; до этого не используем файл в игре |

В SQL используем внешние ключи между модулями общей БД. Для вызова Wallet из Games/P2P/Loans используем Java-интерфейсы внутри Core, не HTTP.

## 2. Где сохраняем всё одной транзакцией

| Действие | Что сохраняем вместе |
|---|---|
| Регистрация | Аккаунт, начальные счета и необходимые записи журнала |
| Ответ угадайки | Состояние round, при успехе награду, accounts, postings и outbox |
| Расчёт рулетки | Итог round, закрытие резерва, проводки, баланс и outbox |
| Ставка дуэли | Проверку фазы, запись bet и резерв Wallet |
| Итог дуэли | Итог матча, выплаты/возвраты игрокам и зрителям, проводки и outbox |
| Создание P2P-заявки | Order и резерв |
| Принятие P2P | Состояние заявки, одного контрагента, deal и второй резерв |
| Завершение P2P | Два подтверждения, обе валюты, закрытие резервов, статусы и outbox |
| Кредит / погашение | Loan, проводки, баланс и outbox |
| Просрочка | OVERDUE, users.status=SCAM, shame_entry и outbox |
| Сообщение | Проверку прав, текст сообщения и outbox |

SQL и отправку WebSocket не объединяем в одну транзакцию. Сначала делаем commit, затем публикуем событие через outbox. После потери HTTP-ответа повторяем прежний ключ, а не начисление.

Для demo-reset сначала завершаем или отменяем активные обязательства обычными командами. Не сбрасываем активную дуэль в ущерб сопернику. После этого восстанавливаем демо-состояние под блокировкой аккаунта, сохраняем историю и аудируем финансовые изменения. Для обычного SCAM-аккаунта reset не разрешаем.

## 3. Протоколы

| Связь | Протокол | Для чего используем |
|---|---|---|
| Browser → Nginx | HTTPS / HTML, CSS, JS | Загружаем SPA и assets |
| React → Gateway через Nginx | HTTPS REST / JSON | Выполняем команды и читаем snapshot с cookie/CSRF |
| React ↔ Gateway через Nginx | WSS / JSON envelope | Подписываемся на обновления через native WebSocket |
| React ↔ Worker | postMessage / structured clone | Агрегируем точки вне UI-thread |
| Gateway → Spring Core | HTTP REST / JSON внутри compose, service JWT | Передаём DTO и проверенный контекст, повторно проверяем права в Core |
| Core module → Core module | Java application service / interface | Вызываем Wallet/Identity внутри одного процесса и транзакции |
| Core → PostgreSQL | JDBC / PostgreSQL wire / SQL | Читаем и меняем общую БД |
| Core / Gateway → Redis | RESP | Используем cache, presence, rate limit и очередь |
| Core outbox → Redis → Gateway | RESP / PubSub | Публикуем live-события после commit без гарантии replay |
| Core → MinIO/S3 | S3-compatible API | Выдаём подписанные URL и проверяем загрузки |
| Browser → Storage endpoint | HTTPS signed GET/PUT | Читаем/загружаем изображения без S3 credentials |
| Core → AI provider | HTTPS / JSON | Получаем rewrite с timeout 5 секунд |
| SDK → Sentry; Browser → Метрика | HTTPS | Отправляем обезличенные ошибки и события |

При выходе из доверенной внутренней сети включаем TLS для соответствующих соединений. Не публикуем Core, Redis и PostgreSQL напрямую в интернет.

## 4. События

| Type | Где формируем | Кому отправляем / как восстанавливаем |
|---|---|---|
| price.tick | market | Обновляем публичный график; после разрыва читаем GET market/candles |
| balance.changed | wallet / outbox | Отправляем только в private me; сверяем через GET wallet |
| duel.updated | duels / outbox | Обновляем разрешённый snapshot матча, скрываем ответы до reveal; читаем GET duels/{id} |
| duel.settled | duels / outbox | Отправляем подтверждённый итог; личный баланс отдельно передаём владельцу |
| order.updated | p2p / outbox | Публикуем ID/статус заявки; приватные подтверждения читаем через GET deals/{id} с проверкой участников |
| chat.message | chat / outbox | Отправляем только в разрешённую комнату, не обходим membership |
| loan.overdue | loans / outbox | Сообщаем владельцу об OVERDUE/SCAM; перечитываем GET me и кредит |
| subscribed / pong / error | gateway | Обслуживаем конкретное соединение, не выполняем финансовые изменения |

В доменном envelope передаём eventId, eventVersion, type, aggregateId, aggregateVersion, occurredAt, requestId и payload. Для control events используем connection ID и локальный счётчик.

Повторы убираем по eventId, старые версии не применяем. При пропуске версии перечитываем snapshot. После reconnect переподписываемся на комнаты и восстанавливаем состояние по HTTP. Не отправляем скрытые ответы, cookie и секреты в payload.

Для приёма финансовой команды используем HTTP и Idempotency-Key; WebSocket оставляем для обновлений. Если закрываем вкладку после принятой команды, всё равно завершаем расчёт на сервере.

## 5. Что сверяем с макетами и G1

Сохраняем публичный терминал, вход/демо, три игры, стакан, чат, кредит и доску. Для SCAM оставляем доступ к данным, но закрываем новые экономические действия.

В макетах предусматриваем loading, неверный ответ, истёкший round, пустой стакан, отсутствие соперника, ничью, просрочку, ошибку AI и reconnect. Для подтверждения результата показываем серверный snapshot, не только анимацию.

Уточняем два места в старых материалах: в дуэли выбираем возврат без overtime; долговечные данные матча сохраняем в PostgreSQL, а Redis используем для ускорения. Публичным API из G1 добавляем префикс /api/v1. До реализации отдельно проверяем DTO, OpenAPI, схемы событий и тесты.
