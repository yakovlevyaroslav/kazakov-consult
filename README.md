# Лендинг (Webpack + SCSS + JS)

Одностраничный адаптивный лендинг со сборкой **Webpack 5**, стилями на **SCSS** и ванильным JavaScript. В production-сборке минифицируются **HTML**, **CSS** и **JS**.

## Требования

- [Node.js](https://nodejs.org/) 18+ (рекомендуется LTS)

## Установка

```bash
npm install
```

## Команды

| Команда | Описание |
|--------|----------|
| `npm start` | Режим разработки: dev-server на [http://localhost:8080](http://localhost:8080), стили через `style-loader` (без отдельного CSS-файла), без минификации |
| `npm run start:api` | Локальный API-сервер для проверки SmartCaptcha и отправки заявки |
| `npm run build` | Production: папка `dist/` — хэшированные `js/` и `css/`, минификация скриптов (Terser), стилей (cssnano через CssMinimizerPlugin) и HTML |
| `./dev.sh` | Запускает API и dev-server в одном терминале (live-обновление верстки) |
| `./prod.sh` | Собирает production и запускает сервер раздачи `dist` |

После `npm run build` раздавайте содержимое каталога `dist/` любым статическим хостингом.

## Структура проекта

```
src/
  index.html          — шаблон для HtmlWebpackPlugin
  main.js             — точка входа: подключает SCSS и логику приложения
  js/
    form.js           — валидация, маска контакта, отправка формы
    form-config.js    — публичный ключ SmartCaptcha и URL API заявки
  styles/
    main.scss         — сборка стилей
    _variables.scss   — токены и брейкпоинты
    _*.scss           — секции интерфейса
```

При необходимости добавьте `src/assets/` и подключите файлы через `import` в JS или настройте `copy-webpack-plugin`.

## SmartCaptcha + отправка заявки

### 1) Настройка в Yandex Cloud

1. Создайте SmartCaptcha и получите:
   - публичный ключ (`sitekey`) для фронта;
   - приватный ключ (`secret`) для сервера.
2. Укажите `sitekey` в `src/js/form-config.js`.

### 2) Настройка backend-переменных

1. Скопируйте `.env.example` в `.env`.
2. Заполните значения:
   - `FORM_PUBLIC_URL` — публичный URL фронта (локально `http://localhost:8080`);
   - `SMARTCAPTCHA_SECRET_KEY` — приватный ключ SmartCaptcha;
   - `FORM_RECIPIENT_EMAIL` — email, куда отправлять заявки;
   - `FORM_SUBJECT` — тема письма (опционально).

### 3) Локальный запуск

Рекомендуемый вариант (одной командой):

```bash
./dev.sh
```

Ручной вариант (два терминала):

Запускайте в двух терминалах:

```bash
npm run start:api
npm start
```

`webpack-dev-server` проксирует `/api/*` на `http://localhost:3000`, поэтому фронт продолжит работать на `http://localhost:8080`.

### 3.1) Production-запуск

```bash
./prod.sh
```

Скрипт сначала выполняет `npm run build`, затем запускает сервер на `http://localhost:3000` (или на порту из `PORT` в `.env`).

### 4) Что происходит при отправке

- фронт получает токен SmartCaptcha;
- токен отправляется на `/api/lead`;
- сервер валидирует токен в Yandex SmartCaptcha;
- только после успешной валидации отправляет заявку на email через FormSubmit.

## Настройка отправки на email (FormSubmit)

Используется [FormSubmit](https://formsubmit.co/).

1. Укажите email в `.env` (`FORM_RECIPIENT_EMAIL`).
2. Запустите `npm run start:api` и `npm start` или опубликуйте сборку вместе с API.
3. Отправьте форму один раз.
4. Подтвердите форму по ссылке из письма FormSubmit (активация обязательна).

## Требования к полям формы

- **Имя** — не короче 2 символов после обрезки пробелов.
- **Контакт** — телефон (10–15 цифр), `@username` в Telegram или ссылка `https://t.me/username`.

После успешной отправки показывается сообщение и форма очищается.

## Альтернатива: EmailJS

Логику `fetch` в `src/js/form.js` можно заменить на [EmailJS](https://www.emailjs.com/) при необходимости.

## Предрелиз и публикация

Сейчас включён **запрет индексации**: `public/robots.txt` (`Disallow: /`), в `index.html` — `meta name="robots" content="noindex, nofollow"`, в `server.js` — заголовок `X-Robots-Tag`. Перед открытым продом отключите это и настройте индексацию.

Чеклист перед релизом:

1. **Домен и SEO** — во всём `src/index.html` замените `https://example.com/` на боевой URL (canonical, Open Graph, Twitter, JSON-LD). Добавьте реальный `og-image` в `public/` и обновите пути в мета-тегах.
2. **`public/robots.txt`** — вместо `Disallow: /` задайте `Allow: /` и при необходимости строку `Sitemap: https://ваш-домен/sitemap.xml` (файл sitemap можно сгенерировать отдельно).
3. **`server.js`** — удалите middleware с `X-Robots-Tag` (или оставьте только для staging).
4. **`FORM_PUBLIC_URL`** в `.env` на проде — точный публичный URL сайта (важно для FormSubmit).
5. **Прод-сервер** — запуск через `./prod.sh` выставляет `NODE_ENV=production` (короткие ответы об ошибках API без поля `error` в теле).
6. **Политика и куки** — заполните `public/privacy-policy.html`, проверьте текст баннера cookie в `index.html`.
7. **Секьюрити** — в `public/.well-known/security.txt` укажите рабочий `Contact:`.
8. **Ключи** — не публикуйте приватные ключи в git; публичный ключ капчи в `form-config.js` при желании вынесите в переменные сборки.

Файлы в `public/` (в т.ч. `robots.txt`, иконки, `privacy-policy.html`) копируются в корень `dist/` при сборке.
