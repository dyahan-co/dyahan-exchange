# Правила контрибьюта

Работаем по [GitHub flow](https://docs.github.com/ru/get-started/using-github/github-flow).

1. В `main` напрямую не коммитим — ветка защищена.
2. От свежего `main` создаём ветку `<тип>/<кратко-что-делаем>`, например `feat/guess-round-page`.
   Типы: `feat/`, `fix/`, `ci/`, `test/`, `docs/`. Одна ветка — одна задача.
3. Открываем PR по шаблону. Для контрольной точки G3 название начинается с пункта: `[G3.x] ...`.
4. Merge возможен только когда зелёные проверки `lint`, `unit`, `coverage`, `e2e` и есть review.
5. Merge — squash, ветка после этого удаляется.

## Локально

```bash
npm ci
npm run lint && npm run format:check
npm run test:unit
npm run test:coverage   # порог 80%
npm run test:e2e
```

## Не коммитим

`.env` и ключи, PII и dumps, пользовательские загрузки, build output, скрытые ответы игровых раундов.
