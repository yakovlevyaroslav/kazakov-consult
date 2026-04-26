/**
 * Форма обратной связи на лендинге.
 *
 * Зона ответственности:
 *  — валидация полей «Имя» и «Контакт»;
 *  — маска для контакта (телефон / @ник / ссылка https://t.me/…);
 *  — отправка JSON на FormSubmit (см. form-config.js).
 *
 * Ожидаемые id в разметке: #feedback-form, #name, #contact-input,
 * #name-error, #contact-error, #form-status, #submit-btn; опционально #year.
 */

import { FORM_CONFIG } from "./form-config.js";

// =============================================================================
// DOM: ссылки на узлы формы
// =============================================================================

const feedbackForm = document.getElementById("feedback-form");
const nameField = document.getElementById("name");
const contactField = document.getElementById("contact-input");
const nameFieldError = document.getElementById("name-error");
const contactFieldError = document.getElementById("contact-error");
const formStatusBox = document.getElementById("form-status");
const submitButton = document.getElementById("submit-btn");
const footerYear = document.getElementById("year");

// =============================================================================
// Проверка, что вёрстка совпадает с ожиданиями скрипта
// =============================================================================

if (
  !(feedbackForm instanceof HTMLFormElement) ||
  !(nameField instanceof HTMLInputElement) ||
  !(contactField instanceof HTMLInputElement) ||
  !(nameFieldError instanceof HTMLElement) ||
  !(contactFieldError instanceof HTMLElement) ||
  !(formStatusBox instanceof HTMLElement) ||
  !(submitButton instanceof HTMLButtonElement)
) {
  throw new Error(
    "Проверьте разметку: нужны #feedback-form, #name, #contact-input, " +
      "#name-error, #contact-error, #form-status, #submit-btn (кнопка <button type=\"submit\">)."
  );
}

/** Год в подвале — без ошибки, если блока нет */
if (footerYear) {
  footerYear.textContent = String(new Date().getFullYear());
}

// =============================================================================
// Константы валидации
// =============================================================================

const MIN_NAME_LENGTH = 2;

/** Ник в Telegram: буква в начале, 5–32 символа всего */
const TELEGRAM_USERNAME = /^@([a-zA-Z][a-zA-Z0-9_]{4,31})$/;

/** Ссылка на профиль в Telegram */
const TELEGRAM_PROFILE_URL =
  /^https?:\/\/(www\.)?t\.me\/([a-zA-Z][a-zA-Z0-9_]{4,31})(\/)?(\?.*)?$/i;

// =============================================================================
// Валидация
// =============================================================================

/**
 * @param {string} value
 * @returns {string} пустая строка = ок, иначе текст ошибки
 */
function validateNameField(value) {
  const text = value.trim();
  if (!text) return "Укажите имя.";
  if (text.length < MIN_NAME_LENGTH) {
    return `Имя должно быть не короче ${MIN_NAME_LENGTH} символов.`;
  }
  return "";
}

/**
 * Контакт: телефон (10–15 цифр), @username или https://t.me/username
 * @param {string} value
 * @returns {string}
 */
function validateContactField(value) {
  const text = value.trim();
  if (!text) {
    return "Укажите способ связи: телефон, @username в Telegram или ссылку t.me.";
  }

  if (TELEGRAM_USERNAME.test(text) || TELEGRAM_PROFILE_URL.test(text)) {
    return "";
  }

  const digitsOnly = text.replace(/\D/g, "");
  if (digitsOnly.length >= 10 && digitsOnly.length <= 15) {
    return "";
  }

  return "Введите корректный телефон (от 10 цифр), ник в Telegram (@username) или ссылку вида https://t.me/username.";
}

// =============================================================================
// Маска поля «Контакт» (режим по первому значимому символу)
// =============================================================================

/** Пользователь вводит URL (уже есть схема или набирает http…) */
function contactInputLooksLikeUrl(head) {
  const h = head.trimStart();
  if (/^https?:\/\//i.test(h)) return true;
  if (/^h(?:t(?:t(?:p(?:s?)?)?)?)?$/i.test(h)) return true;
  return h.toLowerCase().startsWith("http");
}

/** Пользователь вводит телефон */
function contactInputLooksLikePhone(head) {
  const h = head.trimStart();
  return h !== "" && /^[\d+]/.test(h);
}

/**
 * Российский номер: +7 (XXX) XXX-XX-XX; иначе до 15 цифр с «+» и пробелами по 3.
 * @param {string} value
 */
function maskPhoneInput(value) {
  const noSpaces = value.replace(/\s/g, "");
  if (noSpaces === "+") return "+";

  let digits = value.replace(/\D/g, "");
  if (digits.length === 0) return "";

  if (digits.startsWith("8")) digits = "7" + digits.slice(1);
  if (digits.startsWith("9")) digits = "7" + digits;

  if (digits.startsWith("7")) {
    digits = digits.slice(0, 11);
    const local = digits.slice(1);
    let formatted = "+7";
    if (local.length > 0) formatted += " (" + local.slice(0, 3);
    if (local.length >= 3) formatted += ")";
    if (local.length > 3) formatted += " " + local.slice(3, 6);
    if (local.length > 6) formatted += "-" + local.slice(6, 8);
    if (local.length > 8) formatted += "-" + local.slice(8, 10);
    return formatted;
  }

  digits = digits.slice(0, 15);
  let formatted = "+";
  for (let i = 0; i < digits.length; i += 1) {
    if (i > 0 && i % 3 === 0) formatted += " ";
    formatted += digits[i];
  }
  return formatted;
}

/**
 * @ник: только допустимые символы, без цифры/подчёркивания в начале ника.
 * @param {string} value
 */
function maskTelegramUsernameInput(value) {
  const at = value.indexOf("@");
  if (at === -1) return value;

  const prefix = value.slice(0, at);
  let handle = value.slice(at + 1).replace(/[^a-zA-Z0-9_]/g, "");
  if (handle.length === 0) return prefix + "@";

  if (/^[0-9_]/.test(handle)) {
    handle = handle.replace(/^[0-9_]+/, "");
  }
  if (handle.length === 0) return prefix + "@";

  return prefix + "@" + handle.slice(0, 32);
}

/**
 * Нормализация к https://t.me/username
 * @param {string} value
 */
function maskTelegramUrlInput(value) {
  let compact = value.replace(/\s/g, "");
  if (compact === "") return "";

  // Пока нет «https://», оставляем только символы URL и добираем схему
  if (!/^https:\/\//i.test(compact)) {
    let buffer = "";
    for (let i = 0; i < compact.length; i += 1) {
      const ch = compact[i];
      if (/[hHtTpPsS:/.\-_]/i.test(ch)) buffer += ch;
    }
    if (buffer.length > 64) buffer = buffer.slice(0, 64);
    if (buffer.toLowerCase().startsWith("http://")) {
      buffer = "https://" + buffer.slice(7);
    }
    if (/^https:\/\//i.test(buffer)) return maskTelegramUrlInput(buffer);
    return buffer;
  }

  if (compact.toLowerCase().startsWith("http://")) {
    compact = "https://" + compact.slice(7);
  }

  let path = compact.slice(8).replace(/[^a-zA-Z0-9./_-]/g, "");
  if (path.toLowerCase().startsWith("www.")) path = path.slice(4);

  const pathLower = path.toLowerCase();
  if (!pathLower.startsWith("t.me")) {
    return "https://" + path.slice(0, 24);
  }

  let afterTme = path.slice(4);
  if (afterTme.startsWith("/")) afterTme = afterTme.slice(1);

  const username = afterTme.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 32);
  return "https://t.me/" + username;
}

/**
 * Главный вход маски: порядок важен (@ раньше URL, URL раньше телефона).
 * @param {string} value
 */
function formatContactField(value) {
  const significant = value.trimStart();
  if (significant === "") {
    return value.trim() === "" ? "" : value;
  }

  if (significant[0] === "@") {
    return maskTelegramUsernameInput(value);
  }

  if (contactInputLooksLikeUrl(significant)) {
    return maskTelegramUrlInput(value);
  }

  if (contactInputLooksLikePhone(significant)) {
    return maskPhoneInput(value);
  }

  return value;
}

// =============================================================================
// Ошибки полей и общий статус отправки
// =============================================================================

/**
 * @param {HTMLInputElement} field
 * @param {HTMLElement} errorNode
 * @param {string} message пусто = сброс ошибки
 */
function toggleFieldError(field, errorNode, message) {
  if (message) {
    field.classList.add("is-invalid");
    field.setAttribute("aria-invalid", "true");
    errorNode.textContent = message;
    errorNode.hidden = false;
  } else {
    field.classList.remove("is-invalid");
    field.removeAttribute("aria-invalid");
    errorNode.textContent = "";
    errorNode.hidden = true;
  }
}

function resetFormStatusMessage() {
  formStatusBox.textContent = "";
  formStatusBox.classList.remove("is-success", "is-error");
}

/**
 * @param {string} text
 * @param {"success" | "error"} kind
 */
function setFormStatusMessage(text, kind) {
  formStatusBox.textContent = text;
  formStatusBox.classList.remove("is-success", "is-error");
  formStatusBox.classList.add(kind === "success" ? "is-success" : "is-error");
}

/** Проверка, что в form-config задан реальный email */
function hasValidRecipientEmail() {
  const email = FORM_CONFIG.recipientEmail.trim();
  if (!email || email === "you@example.com") {
    setFormStatusMessage(
      "Укажите email получателя в src/js/form-config.js (recipientEmail).",
      "error"
    );
    return false;
  }
  return true;
}

// =============================================================================
// Отправка на FormSubmit (AJAX)
// =============================================================================

/**
 * @param {SubmitEvent} event
 */
async function onFeedbackFormSubmit(event) {
  event.preventDefault();
  resetFormStatusMessage();

  const nameErrorText = validateNameField(nameField.value);
  const contactErrorText = validateContactField(contactField.value);

  toggleFieldError(nameField, nameFieldError, nameErrorText);
  toggleFieldError(contactField, contactFieldError, contactErrorText);

  if (nameErrorText || contactErrorText) {
    (nameErrorText ? nameField : contactField).focus();
    return;
  }

  if (!hasValidRecipientEmail()) return;

  const submitUrl = `https://formsubmit.co/ajax/${encodeURIComponent(
    FORM_CONFIG.recipientEmail.trim()
  )}`;

  const payload = {
    name: nameField.value.trim(),
    contact: contactField.value.trim(),
    message: "—",
    _subject: FORM_CONFIG.subject,
    _template: "table",
  };

  submitButton.disabled = true;
  const submitLabelBefore = submitButton.textContent ?? "Отправить";
  submitButton.textContent = "Отправка…";

  try {
    const response = await fetch(submitUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const payloadJson = await response.json().catch(() => ({}));
    const success =
      response.ok &&
      (payloadJson.success === "true" || payloadJson.success === true);

    if (!success) {
      const fromServer =
        typeof payloadJson.message === "string"
          ? payloadJson.message
          : "Не удалось отправить. Попробуйте позже.";
      setFormStatusMessage(fromServer, "error");
      return;
    }

    setFormStatusMessage(
      "Спасибо! Сообщение отправлено — мы свяжемся с вами.",
      "success"
    );
    feedbackForm.reset();
    toggleFieldError(nameField, nameFieldError, "");
    toggleFieldError(contactField, contactFieldError, "");
  } catch {
    setFormStatusMessage(
      "Ошибка сети. Проверьте подключение к интернету и попробуйте снова.",
      "error"
    );
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = submitLabelBefore;
  }
}

// =============================================================================
// События
// =============================================================================

feedbackForm.addEventListener("submit", onFeedbackFormSubmit);

nameField.addEventListener("input", () => {
  toggleFieldError(nameField, nameFieldError, validateNameField(nameField.value));
  if (formStatusBox.classList.contains("is-error")) resetFormStatusMessage();
});

contactField.addEventListener("input", () => {
  const raw = contactField.value;
  const masked = formatContactField(raw);
  if (masked !== raw) {
    contactField.value = masked;
    const caret = masked.length;
    contactField.setSelectionRange(caret, caret);
  }
  toggleFieldError(
    contactField,
    contactFieldError,
    validateContactField(contactField.value)
  );
  if (formStatusBox.classList.contains("is-error")) resetFormStatusMessage();
});
