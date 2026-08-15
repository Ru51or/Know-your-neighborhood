
/* (Regex Patterns) */
const Patterns = {
  digitsOnly:   /^[0-9]+$/,                       
  lettersOnly:  /^[\u0600-\u06FFa-zA-Z\s]+$/,      
  username:     /^[a-zA-Z0-9_]+$/,                
  arabicText:   /^[\u0600-\u06FF0-9\s.,،:_()\-\/]+$/, 
  hasLetter:    /[a-zA-Z\u0600-\u06FF]/,
  hasDigit:     /[0-9]/,
  saPhone:      /^05[0-9]{8}$/,                    
  nationalId:   /^[12][0-9]{9}$/                   
};

/*  (Rules) */
const Rules = {
  required: (label) => (v) =>
    (!v || String(v).trim() === '') ? `حقل «${label}» مطلوب، الرجاء تعبئته.` : null,

  minLength: (label, n) => (v) =>
    (v && v.trim().length < n) ? `«${label}» يجب أن لا يقل عن ${n} حروف.` : null,

  maxLength: (label, n) => (v) =>
    (v && v.trim().length > n) ? `«${label}» يجب أن لا يزيد عن ${n} حرف.` : null,

  /* أرقام فقط */
  digitsOnly: (label) => (v) =>
    (v && !Patterns.digitsOnly.test(v.trim()))
      ? `«${label}» يقبل أرقام فقط، الرجاء عدم إدخال حروف أو رموز.` : null,

  /* حروف فقط */
  lettersOnly: (label) => (v) =>
    (v && !Patterns.lettersOnly.test(v.trim()))
      ? `«${label}» يقبل حروف فقط، الرجاء عدم إدخال أرقام أو رموز.` : null,

  /* منع أن يكون النص كله أرقام */
  notOnlyDigits: (label) => (v) =>
    (v && Patterns.digitsOnly.test(v.trim()))
      ? `«${label}» لا يمكن أن يكون أرقامًا فقط، اكتب وصفًا واضحًا.` : null,

  exactLength: (label, n) => (v) =>
    (v && v.trim().length !== n) ? `«${label}» يجب أن يتكوّن من ${n} خانة بالضبط.` : null,

  pattern: (regex, message) => (v) =>
    (v && !regex.test(v.trim())) ? message : null,

  /* كلمة المرور: حرف واحد على الأقل ورقم واحد على الأقل */
  strongPassword: (label) => (v) => {
    if (!v) return null;
    if (!Patterns.hasLetter.test(v)) return `«${label}» يجب أن يحتوي على حرف واحد على الأقل.`;
    if (!Patterns.hasDigit.test(v))  return `«${label}» يجب أن يحتوي على رقم واحد على الأقل.`;
    if (/\s/.test(v))                return `«${label}» لا يجب أن يحتوي على مسافات.`;
    return null;
  },

  /* القائمة المنسدلة: لازم يختار قيمة غير الفارغة */
  selected: (label) => (v) =>
    (!v || v === '') ? `الرجاء اختيار «${label}» من القائمة.` : null,

  /* المرفق: نوع الملف وحجمه */
  file: (label, allowed = ['pdf','jpg','jpeg','png'], maxMB = 5) => (fileInput) => {
    const file = fileInput?.files?.[0];
    if (!file) return null;                       
    const ext = file.name.split('.').pop().toLowerCase();
    if (!allowed.includes(ext))
      return `«${label}» يقبل الملفات من نوع: ${allowed.join('، ')} فقط.`;
    if (file.size > maxMB * 1024 * 1024)
      return `حجم «${label}» يجب أن لا يتجاوز ${maxMB} ميجابايت.`;
    return null;
  }
};

/*  (Form Schemas)*/
const Schemas = {

  /*  نموذج تسجيل الدخول  */
  login: {
    username: [
      Rules.required('اسم المستخدم'),
      Rules.minLength('اسم المستخدم', 4),
      Rules.maxLength('اسم المستخدم', 20),
      Rules.pattern(Patterns.username,
        'اسم المستخدم يقبل حروفًا إنجليزية وأرقامًا فقط، بدون مسافات أو رموز.')
      
    ],
    password: [
      Rules.required('الرمز السري'),
      Rules.minLength('الرمز السري', 8),
      Rules.maxLength('الرمز السري', 32),
      Rules.strongPassword('الرمز السري')
    ]
  },

  /*  نموذج تقديم طلب جديد  */
  newRequest: {
    title: [
      Rules.required('عنوان الطلب'),
      Rules.minLength('عنوان الطلب', 5),
      Rules.maxLength('عنوان الطلب', 60),
      Rules.notOnlyDigits('عنوان الطلب'),
      Rules.pattern(Patterns.arabicText,
        'عنوان الطلب يقبل الحروف العربية والأرقام فقط، بدون رموز غريبة.')
    ],
    neighborhoodId: [ Rules.selected('الحي') ],
    serviceTypeId:  [ Rules.selected('نوع الخدمة') ],
    description: [
      Rules.required('وصف الطلب'),
      Rules.minLength('وصف الطلب', 10),
      Rules.maxLength('وصف الطلب', 500),
      Rules.notOnlyDigits('وصف الطلب')
    ],
    attachment: [ Rules.file('المرفق', ['pdf','jpg','jpeg','png'], 5) ]
  }
};

const Validator = {

  validateField(input, rules) {
    const value = (input.type === 'file') ? input : input.value;
    for (const rule of rules) {
      const error = rule(value);
      if (error) return error;                 
    }
    return null;
  },

  /* إظهار / إخفاء الخطأ في الواجهة */
  showError(input, message) {
    const box   = input.closest('.input-box');
    const error = document.querySelector(`[data-error-for="${input.name}"]`);
    if (box) { box.classList.add('is-invalid'); box.classList.remove('is-valid'); }
    if (error) { error.textContent = message; error.classList.add('is-shown'); }
    input.setAttribute('aria-invalid', 'true');
  },

  clearError(input) {
    const box   = input.closest('.input-box');
    const error = document.querySelector(`[data-error-for="${input.name}"]`);
    if (box) { box.classList.remove('is-invalid'); box.classList.add('is-valid'); }
    if (error) { error.textContent = ''; error.classList.remove('is-shown'); }
    input.removeAttribute('aria-invalid');
  },

  validateForm(form, schema) {
    const errors = {};
    const data   = {};
    let firstInvalid = null;

    for (const [name, rules] of Object.entries(schema)) {
      const input = form.elements[name];
      if (!input) continue;

      const message = this.validateField(input, rules);
      if (message) {
        errors[name] = message;
        this.showError(input, message);
        if (!firstInvalid) firstInvalid = input;
      } else {
        this.clearError(input);
        data[name] = (input.type === 'file') ? (input.files[0] || null) : input.value.trim();
      }
    }

    if (firstInvalid) firstInvalid.focus();     
    return { valid: Object.keys(errors).length === 0, data, errors };
  },

  
  attachLiveValidation(form, schema) {
    for (const [name, rules] of Object.entries(schema)) {
      const input = form.elements[name];
      if (!input) continue;

      input.addEventListener('blur', () => {
        const message = this.validateField(input, rules);
        message ? this.showError(input, message) : this.clearError(input);
      });

      input.addEventListener('input', () => {
        const box = input.closest('.input-box');
        if (box?.classList.contains('is-invalid')) {
          const message = this.validateField(input, rules);
          if (!message) this.clearError(input);
        }
      });

      if (input.tagName === 'SELECT') {
        input.addEventListener('change', () => {
          const message = this.validateField(input, rules);
          message ? this.showError(input, message) : this.clearError(input);
        });
      }
    }
  },

  /* رسالة عامة أعلى النموذج */
  alert(form, message, type = 'error') {
    const box = form.querySelector('.form-alert');
    if (!box) return;
    box.textContent = message;
    box.className = `form-alert form-alert--${type} is-shown`;
  },

  clearAlert(form) {
    form.querySelector('.form-alert')?.classList.remove('is-shown');
  }
};

document.addEventListener('input', (e) => {
  if (e.target.dataset.only === 'digits') {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
  }
});
