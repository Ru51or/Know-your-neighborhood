
const BASE_URL  = 'http://localhost/aarif-hayak2/api';

/* مجلد المرفقات  */
const FILES_URL = BASE_URL + '/uploads';

const ENDPOINTS = {
  login:          '/login.php',                          // POST
  neighborhoods:  '/neighborhoods.php',                  // GET  — جدول الأحياء
  neighborhood:   (id) => `/neighborhoods.php?id=${id}`, // GET
  serviceTypes:   '/service-types.php',                  // GET  — جدول أنواع الخدمات
  myRequests:     '/requests.php',                       // GET  — طلبات المستخدم الحالي
  requestById:    (id) => `/requests.php?id=${id}`,      // GET
  createRequest:  '/requests.php'                        // POST — حفظ طلب جديد
};

/*  (Session) — حفظ التوكن وبيانات المستخدم في المتصفح*/
const Session = {
  save(user, token) {
    sessionStorage.setItem('ah_user',  JSON.stringify(user));
    sessionStorage.setItem('ah_token', token || '');
  },
  get user()  { try { return JSON.parse(sessionStorage.getItem('ah_user')); } catch { return null; } },
  get token() { return sessionStorage.getItem('ah_token') || ''; },
  clear()     { sessionStorage.removeItem('ah_user'); sessionStorage.removeItem('ah_token'); },
  /* لو ما فيه جلسة يرجّع المستخدم لتسجيل الدخول */
  guard() { if (!this.user) window.location.href = 'index.html'; }
};

/*  (Request helper) */
async function request(path, { method = 'GET', body = null, isForm = false } = {}) {
  const headers = {};
  if (Session.token) headers['Authorization'] = `Bearer ${Session.token}`;
  if (!isForm && body) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(BASE_URL + path, {
      method,
      headers,
      body: body ? (isForm ? body : JSON.stringify(body)) : null
    });
  } catch {
    throw new Error('تعذّر الاتصال بالخادم، تأكد من تشغيل الخادم ثم حاول مرة أخرى.');
  }

  let payload = null;
  try { payload = await res.json(); } catch { /* استجابة بدون محتوى */ }

  if (res.status === 401 && !path.startsWith(ENDPOINTS.login)) {
    Session.clear();
    window.location.href = 'index.html';
    throw new Error('انتهت الجلسة، الرجاء تسجيل الدخول من جديد.');
  }

  if (!res.ok) {
    throw new Error(payload?.message || 'تعذّر الاتصال بالخادم، حاول مرة أخرى.');
  }
  return payload;
}


const Api = {

  /*  POST /login.php */
  login(username, password) {
    return request(ENDPOINTS.login, { method: 'POST', body: { username, password } });
  },

  /*  GET /neighborhoods.php */
  getNeighborhoods() {
    return request(ENDPOINTS.neighborhoods);
  },

  /*  GET /neighborhoods.php?id= */
  getNeighborhood(id) {
    return request(ENDPOINTS.neighborhood(id));
  },

  /*  GET /service-types.php */
  getServiceTypes() {
    return request(ENDPOINTS.serviceTypes);
  },

  /*  GET /requests.php */
  getMyRequests() {
    return request(ENDPOINTS.myRequests);
  },

  /*  GET /requests.php?id= */
  getRequest(id) {
    return request(ENDPOINTS.requestById(id));
  },

  /*  POST /requests.php */
  createRequest({ title, neighborhoodId, serviceTypeId, description, attachment }) {
    const form = new FormData();
    form.append('title', title);
    form.append('neighborhoodId', neighborhoodId);
    form.append('serviceTypeId', serviceTypeId);
    form.append('description', description);
    if (attachment) form.append('attachment', attachment);

    return request(ENDPOINTS.createRequest, { method: 'POST', body: form, isForm: true });
  }
};


const Ui = {
  escape(text = '') {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },
  show(el)  { el?.classList.remove('is-hidden'); },
  hide(el)  { el?.classList.add('is-hidden'); },
  param(name) { return new URLSearchParams(location.search).get(name); }
};

/* تسجيل الخروج  */
document.addEventListener('click', (e) => {
  if (e.target.closest('[data-action="logout"]')) {
    Session.clear();
    window.location.href = 'index.html';
  }
  if (e.target.closest('[data-action="nav-toggle"]')) {
    document.querySelector('.navbar__links')?.classList.toggle('is-open');
  }
});
