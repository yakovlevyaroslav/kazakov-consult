import { FORM_CONFIG } from "./form-config.js";

const form = document.getElementById("consultation-form");
const nameInput = document.getElementById("name");
const contactInput = document.getElementById("phone");
const nameError = document.getElementById("name-error");
const contactError = document.getElementById("phone-error");
const formStatus = document.getElementById("consultation-form-status");
const captchaContainer = document.getElementById("captcha-container");
const popup = document.getElementById("consultation-popup");
const popupBackdrop = document.getElementById("consultation-popup-backdrop");
const popupDialog = popup?.querySelector(".consultation-popup__dialog");
const popupChoice = document.getElementById("consultation-popup-choice");
const popupSurvey = document.getElementById("consultation-popup-survey");
const popupToSurveyButton = document.getElementById("consultation-popup-to-survey");
const popupDirectSendButton = document.getElementById("consultation-popup-send-direct");
const popupBackButton = document.getElementById("consultation-popup-back");
const popupSurveySubmitButton = document.getElementById("consultation-popup-send-survey");
const popupSurveyStatus = document.getElementById("consultation-popup-survey-status");
const surveyQ1 = document.getElementById("survey-q1");
const surveyQ2 = document.getElementById("survey-q2");
const surveyQ3 = document.getElementById("survey-q3");

if (
  !form ||
  !nameInput ||
  !contactInput ||
  !nameError ||
  !contactError ||
  !formStatus ||
  !captchaContainer ||
  !popup ||
  !popupBackdrop ||
  !popupDialog ||
  !popupChoice ||
  !popupSurvey ||
  !popupToSurveyButton ||
  !popupDirectSendButton ||
  !popupBackButton ||
  !popupSurveySubmitButton ||
  !popupSurveyStatus ||
  !surveyQ1 ||
  !surveyQ2 ||
  !surveyQ3
) {
  // Form can be absent on some pages.
} else {
  const submitButton = document.getElementById("consultation-form-send");
  const defaultButtonText = submitButton?.textContent?.trim() || "Отправить заявку";
  let isSubmitting = false;
  let isNameTouched = false;
  let isContactTouched = false;
  let contactMode = null;
  let previousContactValue = "";
  let captchaToken = "";
  let isCaptchaVerified = false;
  let captchaWidgetId = null;
  let isCaptchaReady = false;

  if (submitButton) {
    submitButton.disabled = true;
  }

  const showFieldError = (input, errorNode, message) => {
    input.classList.add("is-invalid");
    input.setAttribute("aria-invalid", "true");
    errorNode.textContent = message;
  };

  const clearFieldError = (input, errorNode) => {
    input.classList.remove("is-invalid");
    input.removeAttribute("aria-invalid");
    errorNode.textContent = "";
  };

  const setFormStatus = (message, type) => {
    formStatus.textContent = message;
    formStatus.classList.remove("is-success", "is-error");

    if (type) {
      formStatus.classList.add(type === "success" ? "is-success" : "is-error");
    }
  };

  const setPopupSurveyStatus = (message, type) => {
    popupSurveyStatus.textContent = message;
    popupSurveyStatus.classList.remove("is-pending", "is-success", "is-error");
    if (type) {
      popupSurveyStatus.classList.add(`is-${type}`);
    }
  };

  const canSubmitMainForm = () => {
    const canSubmitByCaptcha = isCaptchaReady && isCaptchaVerified && Boolean(captchaToken);
    const isMainFormValid =
      isNameValueValid(nameInput.value) && isContactValueValid(contactInput.value, contactMode);
    return canSubmitByCaptcha && isMainFormValid;
  };

  const updateCaptchaSubmitState = () => {
    const canSubmitMain = canSubmitMainForm();

    if (submitButton && !isSubmitting) {
      submitButton.disabled = !canSubmitMain;
    }

    if (!isSubmitting) {
      popupDirectSendButton.disabled = !canSubmitMain;
      popupSurveySubmitButton.disabled = !canSubmitMain;
    }
  };

  const canOpenConsultationPopup = () => canSubmitMainForm();

  const initCaptcha = () => {
    const { smartCaptchaSitekey } = FORM_CONFIG;
    if (!smartCaptchaSitekey) {
      setFormStatus("Не настроен публичный ключ SmartCaptcha.", "error");
      return;
    }

    const renderWidget = () => {
      if (!window.smartCaptcha || captchaWidgetId !== null) return;

      captchaWidgetId = window.smartCaptcha.render(captchaContainer, {
        sitekey: smartCaptchaSitekey,
        callback: (token) => {
          captchaToken = token || "";
          isCaptchaVerified = Boolean(captchaToken);
          if (captchaToken) setFormStatus("", null);
          updateCaptchaSubmitState();
        },
        "expired-callback": () => {
          captchaToken = "";
          isCaptchaVerified = false;
          updateCaptchaSubmitState();
        },
      });
      isCaptchaReady = true;
      updateCaptchaSubmitState();
    };

    if (window.smartCaptcha) {
      renderWidget();
      return;
    }

    const waitForCaptcha = window.setInterval(() => {
      if (!window.smartCaptcha) return;
      window.clearInterval(waitForCaptcha);
      renderWidget();
    }, 100);
  };

  const resetCaptcha = () => {
    captchaToken = "";
    isCaptchaVerified = false;
    if (window.smartCaptcha && captchaWidgetId !== null) {
      window.smartCaptcha.reset(captchaWidgetId);
    }
    updateCaptchaSubmitState();
  };

  const looksLikeTelegram = (value) => /^@[a-zA-Z0-9_]{5,32}$/.test(value);

  const normalizePhone = (value) => value.replace(/[^\d]/g, "");

  const isNameValueValid = (value) => {
    const trimmed = value.trim();
    if (trimmed.length < 2 || trimmed.length > 100) return false;
    return /^[a-zA-Zа-яА-ЯёЁ\s]+$/.test(trimmed);
  };

  const isContactValueValid = (value, mode) => {
    const trimmed = value.trim();
    if (!trimmed) return false;

    if (mode === "telegram") {
      return looksLikeTelegram(trimmed);
    }

    const digits = normalizePhone(trimmed);
    return digits.length === 11 && /^7\d{10}$/.test(digits);
  };

  const sanitizeName = (value) =>
    value
      .replace(/[^a-zA-Zа-яА-ЯёЁ\s]/g, "")
      .replace(/\s+/g, " ")
      .slice(0, 100);

  const formatPhoneMask = (value) => {
    const digits = normalizePhone(value).slice(0, 11);
    if (!digits) return "";

    let normalized = digits;
    if (normalized[0] === "8") {
      normalized = `7${normalized.slice(1)}`;
    } else if (normalized[0] !== "7" && normalized.length <= 10) {
      normalized = `7${normalized}`;
    }

    const core = normalized.slice(1, 11);
    const p1 = core.slice(0, 3);
    const p2 = core.slice(3, 6);
    const p3 = core.slice(6, 8);
    const p4 = core.slice(8, 10);

    let result = "+7";
    if (p1) result += ` (${p1}`;
    if (p1.length === 3) result += ")";
    if (p2) result += ` ${p2}`;
    if (p3) result += `-${p3}`;
    if (p4) result += `-${p4}`;

    return result;
  };

  const formatTelegramMask = (value) => {
    const username = value.replace(/^@+/, "").replace(/[^a-zA-Z0-9_]/g, "").slice(0, 32);
    return username ? `@${username}` : "@";
  };

  const resolveContactMode = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const firstChar = trimmed[0];

    if (firstChar === "+" || /\d/.test(firstChar)) {
      return "phone";
    }

    if (firstChar === "@" || /[a-zA-Zа-яА-ЯёЁ]/.test(firstChar)) {
      return "telegram";
    }

    return null;
  };

  const validateName = ({ force = false } = {}) => {
    const nameValue = nameInput.value.trim();
    const shouldValidate = force || isNameTouched || nameValue.length > 0;
    if (!shouldValidate) return true;

    if (nameValue.length < 2) {
      showFieldError(nameInput, nameError, "Введите имя (минимум 2 символа).");
      return false;
    } else if (nameValue.length > 100) {
      showFieldError(nameInput, nameError, "Имя не должно быть длиннее 100 символов.");
      return false;
    } else if (!/^[a-zA-Zа-яА-ЯёЁ\s]+$/.test(nameValue)) {
      showFieldError(nameInput, nameError, "Имя может содержать только буквы и пробелы.");
      return false;
    }

    clearFieldError(nameInput, nameError);
    return true;
  };

  const validateContact = ({ force = false } = {}) => {
    const contactValue = contactInput.value.trim();
    const shouldValidate = force || isContactTouched || contactValue.length > 0;
    if (!shouldValidate) return true;

    if (!contactValue) {
      showFieldError(contactInput, contactError, "Укажите телефон, MAX или Telegram.");
      return false;
    } else if (contactMode === "telegram") {
      if (!looksLikeTelegram(contactValue)) {
        showFieldError(
          contactInput,
          contactError,
          "Telegram должен быть в формате @username (5-32 символа)."
        );
        return false;
      }
    } else {
      const digits = normalizePhone(contactValue);
      if (digits.length !== 11 || !/^7\d{10}$/.test(digits)) {
        showFieldError(
          contactInput,
          contactError,
          "Введите корректный номер в формате +7 (XXX) XXX-XX-XX."
        );
        return false;
      }
    }

    clearFieldError(contactInput, contactError);
    return true;
  };

  const validate = ({ force = false } = {}) => {
    const isNameValid = validateName({ force });
    const isContactValid = validateContact({ force });
    return isNameValid && isContactValid;
  };

  const setSubmittingState = (submitting) => {
    isSubmitting = submitting;
    if (!submitButton) return;
    const canSubmitMain = canSubmitMainForm();

    submitButton.disabled = submitting || !canSubmitMain;
    submitButton.textContent = submitting ? "Отправка..." : defaultButtonText;
    popupDirectSendButton.disabled = submitting || !canSubmitMain;
    popupToSurveyButton.disabled = submitting;
    popupBackButton.disabled = submitting;
    popupSurveySubmitButton.disabled = submitting || !canSubmitMain;
    if (submitting) {
      popupDirectSendButton.textContent = "Отправка...";
      popupSurveySubmitButton.textContent = "Отправка...";
    } else {
      popupDirectSendButton.textContent = "Просто отправить";
      popupSurveySubmitButton.textContent = "Отправить заявку";
    }
  };

  nameInput.maxLength = 100;

  const sendForm = async ({ surveyAnswers = null } = {}) => {
    const apiEndpoint = FORM_CONFIG.apiEndpoint?.trim();
    if (!apiEndpoint) {
      throw new Error("Не указан apiEndpoint в FORM_CONFIG.");
    }

    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: nameInput.value.trim(),
        contact: contactInput.value.trim(),
        captchaToken,
        surveyAnswers,
      }),
    });

    const result = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(result?.message || "Ошибка сервера отправки.");
    }

    if (result && result.success === false) {
      throw new Error(result.message || "Не удалось отправить форму.");
    }
  };

  const ensureCaptchaBeforeSubmit = () => {
    if (!isCaptchaReady || !isCaptchaVerified || !captchaToken) {
      setFormStatus("Подтвердите, что вы не робот.", "error");
      return false;
    }

    return true;
  };

  initCaptcha();
  updateCaptchaSubmitState();

  nameInput.addEventListener("input", () => {
    isNameTouched = true;
    const cursor = nameInput.selectionStart ?? nameInput.value.length;
    const sanitized = sanitizeName(nameInput.value);
    if (sanitized !== nameInput.value) {
      nameInput.value = sanitized;
      nameInput.setSelectionRange(Math.min(cursor, sanitized.length), Math.min(cursor, sanitized.length));
    }
    setFormStatus("", null);
    validateName();
    updateCaptchaSubmitState();
  });

  nameInput.addEventListener("blur", () => {
    isNameTouched = true;
    validateName({ force: true });
  });

  contactInput.addEventListener("input", (event) => {
    isContactTouched = true;
    const rawValue = contactInput.value;
    const rawMode = resolveContactMode(rawValue);
    contactMode = rawMode || contactMode;

    if (!rawValue.trim()) {
      contactMode = null;
      contactInput.placeholder = "+7 999 123-45-67 или @telegram";
    } else if (contactMode === "phone") {
      let phoneDigits = normalizePhone(rawValue);
      const prevPhoneDigits = normalizePhone(previousContactValue);
      const isBackwardDelete = event.inputType === "deleteContentBackward";

      // If user deletes formatting symbol (e.g. ")"), also remove nearest digit.
      if (isBackwardDelete && phoneDigits === prevPhoneDigits && phoneDigits.length > 0) {
        phoneDigits = phoneDigits.slice(0, -1);
      }

      contactInput.value = phoneDigits ? formatPhoneMask(phoneDigits) : "";
      contactInput.placeholder = "+7 (999) 123-45-67";
    } else if (contactMode === "telegram") {
      contactInput.value = formatTelegramMask(rawValue);
      contactInput.placeholder = "@username";
    }

    setFormStatus("", null);
    validateContact();
    previousContactValue = contactInput.value;
    updateCaptchaSubmitState();
  });

  contactInput.addEventListener("blur", () => {
    isContactTouched = true;
    validateContact({ force: true });
  });

  const showChoiceStep = () => {
    popupChoice.hidden = false;
    popupSurvey.hidden = true;
  };

  const showSurveyStep = () => {
    popupChoice.hidden = true;
    popupSurvey.hidden = false;
    popupSurvey.scrollIntoView({ behavior: "smooth", block: "start" });
    popupDialog.scrollTo({ top: 0, behavior: "smooth" });
    window.setTimeout(() => {
      surveyQ1.focus();
    }, 220);
  };

  const openPopup = () => {
    showChoiceStep();
    setPopupSurveyStatus("", null);
    popup.hidden = false;
    document.body.style.overflow = "hidden";
  };

  const closePopup = () => {
    popup.hidden = true;
    document.body.style.overflow = "";
    showChoiceStep();
    popupSurvey.reset();
    setPopupSurveyStatus("", null);
  };

  // Ensure survey step is always hidden by default.
  showChoiceStep();

  const validateSurvey = () => {
    const q1 = surveyQ1.value.trim();
    const q2 = surveyQ2.value.trim();
    const q3 = surveyQ3.value.trim();

    if (!q1 || !q2 || !q3) {
      setPopupSurveyStatus("Чтобы отправить опрос, заполните все 3 ответа.", "error");
      return null;
    }

    return { q1, q2, q3 };
  };

  const submitLead = async ({ surveyAnswers = null } = {}) => {
    if (isSubmitting) return;
    if (!ensureCaptchaBeforeSubmit()) return;

    try {
      setPopupSurveyStatus("Отправляю заявку...", "pending");
      setSubmittingState(true);
      await sendForm({ surveyAnswers });
      form.reset();
      popupSurvey.reset();
      closePopup();
      contactMode = null;
      previousContactValue = "";
      contactInput.placeholder = "+7 999 123-45-67 или @telegram";
      clearFieldError(nameInput, nameError);
      clearFieldError(contactInput, contactError);
      isNameTouched = false;
      isContactTouched = false;
      resetCaptcha();
      setPopupSurveyStatus("Заявка отправлена.", "success");
      setFormStatus("Заявка отправлена. Скоро свяжусь с вами.", "success");
    } catch (error) {
      setPopupSurveyStatus(
        "Не удалось отправить заявку. Проверьте соединение и попробуйте еще раз.",
        "error"
      );
      setFormStatus(
        "Не удалось отправить заявку. Проверьте соединение и попробуйте еще раз.",
        "error"
      );
      // Keep error in console for quick diagnostics.
      console.error(error);
    } finally {
      setSubmittingState(false);
    }
  };

  popupToSurveyButton.addEventListener("click", () => {
    showSurveyStep();
  });

  popupBackButton.addEventListener("click", () => {
    showChoiceStep();
  });

  popupDirectSendButton.addEventListener("click", () => {
    showSurveyStep();
    submitLead();
  });

  popupSurvey.addEventListener("submit", (event) => {
    event.preventDefault();
    const surveyAnswers = validateSurvey();
    if (!surveyAnswers) return;
    submitLead({ surveyAnswers });
  });

  popupBackdrop.addEventListener("click", () => {
    if (isSubmitting) return;
    closePopup();
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !popup.hidden && !isSubmitting) {
      closePopup();
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!canOpenConsultationPopup()) {
      if (!isCaptchaReady || !isCaptchaVerified || !captchaToken) {
        setFormStatus("Сначала пройдите капчу.", "error");
      } else {
        setFormStatus("Заполните форму корректно перед отправкой.", "error");
      }
      return;
    }
    if (!ensureCaptchaBeforeSubmit()) return;
    if (!validate({ force: true })) return;
    setFormStatus("", null);
    openPopup();
  });
}
