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
| `npm run build` | Production: папка `dist/` — хэшированные `js/` и `css/`, минификация скриптов (Terser), стилей (cssnano через CssMinimizerPlugin) и HTML |

После `npm run build` раздавайте содержимое каталога `dist/` любым статическим хостингом.

## Структура проекта

```
src/
  index.html          — шаблон для HtmlWebpackPlugin
  main.js             — точка входа: подключает SCSS и логику приложения
  js/
    form.js           — валидация, маска контакта, отправка формы
    form-config.js    — email получателя и тема письма (удобно править)
  styles/
    main.scss         — сборка стилей
    _variables.scss   — токены и брейкпоинты
    _*.scss           — секции интерфейса
```

При необходимости добавьте `src/assets/` и подключите файлы через `import` в JS или настройте `copy-webpack-plugin`.

## Настройка отправки на email (FormSubmit)

Используется [FormSubmit](https://formsubmit.co/).

1. Откройте `src/js/form-config.js` и укажите свой адрес в `recipientEmail`.
2. Запустите `npm start` или опубликуйте сборку из `dist/` и отправьте форму один раз.
3. Подтвердите форму по ссылке из письма FormSubmit (активация обязательна).

## Требования к полям формы

- **Имя** — не короче 2 символов после обрезки пробелов.
- **Контакт** — телефон (10–15 цифр), `@username` в Telegram или ссылка `https://t.me/username`.

После успешной отправки показывается сообщение и форма очищается.

## Альтернатива: EmailJS

Логику `fetch` в `src/js/form.js` можно заменить на [EmailJS](https://www.emailjs.com/) при необходимости.
