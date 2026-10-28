const Validation = {
  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  isValidPassword(password) {
    return password && password.length >= 6;
  },

  isValidAmount(amount) {
    const num = Number(amount);
    return !isNaN(num) && num > 0;
  },

  showFieldError(fieldId, errorText) {
    const errorEl = document.getElementById(`${fieldId}-error`);
    if (errorEl) {
      errorEl.textContent = errorText;
      errorEl.classList.remove('hidden');
    }
  },

  clearFieldError(fieldId) {
    const errorEl = document.getElementById(`${fieldId}-error`);
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.add('hidden');
    }
  }
};

window.Validation = Validation;

