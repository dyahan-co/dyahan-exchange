# План работ на 18.09–01.10

## Ответственность

| Участник | Основная зона ответственности |
|---|---|
| Ян | Spring Core, NestJS gateway, PostgreSQL, ledger и WebSocket |
| Даниил | React, Canvas/WebAudio, Web Worker, unit/e2e и контроль качества |
| Матвей | планирование, архитектурная координация, review, интеграция и observability |

Конкретные задачи распределены с учётом ролей, а нагрузка выровнена: по пять самостоятельных задач каждому участнику и один общий review. У каждой задачи один accountable owner.

## Общий Definition of Done

Задача считается выполненной, когда:

- выполнены критерии приёмки из задачи;
- есть unit/integration тесты на новую логику и e2e на критический пользовательский путь;
- lint, typecheck, unit и e2e проходят локально и в CI;
- API/события и нетривиальные решения отражены в документации;
- нет секретов, PII и скрытых обязательных настроек в репозитории;
- PR получил минимум одно ревью и не содержит несвязанных изменений;
- ветка запускается по README, а UI проверен на desktop и mobile.

## Спринт

| ID | Срок | Owner | Задача | Критерии приёмки / DoD задачи | Зависит от |
|---|---:|---|---|---|---|
| DX-01 | 18.09 | Матвей | Уточнить scope и перенести flow в Figma/Excalidraw | все роли, happy/error paths и 8 основных экранов связаны; ссылка в README | — |
| DX-02 | 18.09 | Ян | Зафиксировать ADR о границе NestJS/Spring и OpenAPI | согласованы auth, WebSocket, ownership данных и protocol; преподавателю отправлен вопрос на согласование backend-задач | — |
| DX-03 | 19.09 | Даниил | Создать React/Vite shell и MUI theme | responsive layout: header, router, error boundary, theme; Lighthouse accessibility ≥ 90 для shell | DX-01 |
| DX-04 | 19.09 | Матвей | Настроить правила репозитория и PR templates | protected main, CODEOWNERS/шаблон PR, convention веток; правила описаны в CONTRIBUTING | — |
| DX-05 | 20.09 | Даниил | CI: lint, format, stylelint, unit, coverage | GitHub Actions блокирует merge при ошибке; coverage threshold 80%; есть отдельные демонстрационные PR для G3 | DX-03 |
| DX-06 | 21.09 | Ян | Модель users + append-only ledger | миграции PostgreSQL; операции атомарны; duplicate idempotency key не меняет баланс второй раз | DX-02 |
| DX-07 | 21.09 | Ян | NestJS gateway и demo auth | `POST /auth/demo`, `GET /me`; access token/cookie; rate limit; контрактные тесты | DX-02, DX-06 |
| DX-08 | 22.09 | Матвей | Docker Compose и `make run` | frontend, gateway, core, postgres, redis стартуют одной командой на arm64; healthchecks зелёные | DX-06, DX-07 |
| DX-09 | 24.09 | Ян | API слоп-угадайки | ответ скрыт от клиента; fuzzy match/синонимы версионированы; повторная отправка безопасна; reward в ledger | DX-06 |
| DX-10 | 25.09 | Даниил | UI слоп-угадайки | загрузка/таймер/ответ/результат/retry; клавиатура и mobile; RTK Query; RTL tests | DX-03, DX-09 |
| DX-11 | 26.09 | Даниил | Canvas-график + Web Worker | seed history + live ticks; расчёты вне main thread; pause в скрытой вкладке; 60 fps на целевом ноутбуке | DX-03, DX-07 |
| DX-12 | 27.09 | Матвей | Аналитика и Sentry foundation | события `demo_started`, `round_started`, `round_finished`; нет PII; source maps; test error помечена environment | DX-03 |
| DX-13 | 28.09 | Даниил | Playwright smoke flow | `публичный терминал → demo auth → guess round → balance +1`; network/seed детерминированы; видео/trace только на failure | DX-08, DX-10 |
| DX-14 | 29.09 | Матвей | Продуктовая проверка первой вертикали | 5 тестовых пользователей проходят flow; проблемы классифицированы; критические исправлены | DX-10, DX-11 |
| DX-15 | 30.09 | Ян | Черновой spike real-time дуэли | документирован протокол событий, reconnect и atomic settlement; demo двух вкладок без ставок | DX-07 |
| DX-16 | 01.10 | Вся команда | G2 review и план следующего спринта | актуальные макеты, архитектурная схема, demo первой вертикали, backlog и риски готовы к показу | все |

## Рекомендуемый порядок PR

Каждый участник должен сделать не менее трёх содержательных PR до индивидуальной защиты. Не складывать sprint в один mega-PR:

1. инфраструктура/shell;
2. отдельный контракт и backend-вертикаль;
3. UI функции с тестами;
4. наблюдаемость и e2e отдельными PR.

Для будущей защиты G3 заранее сохранить понятные PR, демонстрирующие, что CI действительно блокирует сломанные unit tests, падение coverage, e2e и lint/stylelint.
