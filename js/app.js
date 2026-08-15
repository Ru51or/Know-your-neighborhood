
document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;
  const routes = { login, home, neighborhoods, requests, newRequest, myRequests, requestDetails };
  routes[page]?.();
});

/*  صفحة تسجيل الدخول */
function login() {
  const form = document.getElementById('loginForm');
  Validator.attachLiveValidation(form, Schemas.login);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();                       
    Validator.clearAlert(form);

    /* التحقق من المدخلات */
    const { valid, data } = Validator.validateForm(form, Schemas.login);
    if (!valid) return;

    /*  إرسال البيانات للخادم */
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = 'جارِ التحقق...';

    try {
      const res = await Api.login(data.username, data.password);
      Session.save(res.user, res.token);
      window.location.href = 'home.html';
    } catch (err) {
      Validator.alert(form, err.message, 'error');
    } finally {
      btn.disabled = false; btn.textContent = 'تسجيل الدخول';
    }
  });
}

/* الصفحة الرئيسية */
function home() {
  Session.guard();
  const nameEl = document.getElementById('userName');
  if (nameEl && Session.user) nameEl.textContent = Session.user.fullName;
}

/* صفحة الأحياء */
async function neighborhoods() {
  Session.guard();
  const grid   = document.getElementById('hoodsGrid');
  const loader = document.getElementById('loader');

  try {
    const list = await Api.getNeighborhoods();
    Ui.hide(loader);

    if (!list.length) {
      grid.innerHTML = '<p class="empty-state">لا توجد أحياء متاحة حاليًا.</p>';
      return;
    }

    grid.innerHTML = list.map(hood => `
      <article class="hood-card">
        <img class="hood-card__img" src="${hood.image}" alt="حي ${Ui.escape(hood.name)}"
             onerror="this.style.background='#E7E4D2';this.removeAttribute('src')">
        <div class="hood-card__body">
          <div class="hood-card__head">
            <h3 class="hood-card__name">📍 ${Ui.escape(hood.name)}</h3>
            <span class="hood-card__badge">${hood.icon || '🏙️'}</span>
          </div>
          <p class="hood-card__desc">${Ui.escape(hood.description)}</p>
          <div class="hood-card__services">
            <div class="service"><span class="service__icon">🏥</span>مستوصف<br><span class="service__count">${hood.services.clinic}</span></div>
            <div class="service"><span class="service__icon">🌳</span>حديقة<br><span class="service__count">${hood.services.park}</span></div>
            <div class="service"><span class="service__icon">🏫</span>مدرسة<br><span class="service__count">${hood.services.school}</span></div>
            <div class="service"><span class="service__icon">🚶</span>ممشى<br><span class="service__count">${hood.services.walkway}</span></div>
          </div>
        </div>
      </article>
    `).join('');

  } catch (err) {
    Ui.hide(loader);
    grid.innerHTML = `<p class="empty-state">${Ui.escape(err.message)}</p>`;
  }
}

/*  صفحة الطلبات */
function requests() { Session.guard(); }

/*  صفحة تقديم طلب جديد */
async function newRequest() {
  Session.guard();
  const form = document.getElementById('requestForm');

  try {
    const [hoods, types] = await Promise.all([Api.getNeighborhoods(), Api.getServiceTypes()]);

    form.elements.neighborhoodId.innerHTML =
      '<option value="" disabled selected>اختر</option>' +
      hoods.map(h => `<option value="${h.id}">${Ui.escape(h.name)}</option>`).join('');

    form.elements.serviceTypeId.innerHTML =
      '<option value="" disabled selected>اختر</option>' +
      types.map(t => `<option value="${t.id}">${Ui.escape(t.name)}</option>`).join('');

  } catch (err) {
    Validator.alert(form, 'تعذّر تحميل قوائم الأحياء والخدمات: ' + err.message, 'error');
  }

  Validator.attachLiveValidation(form, Schemas.newRequest);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    Validator.clearAlert(form);

    /*  التحقق */
    const { valid, data } = Validator.validateForm(form, Schemas.newRequest);
    if (!valid) {
      Validator.alert(form, 'يوجد خطأ في بعض الحقول، الرجاء مراجعة الرسائل بالأسفل.', 'error');
      return;
    }

    /*   الحفظ في جدول طلبات المستخدم */
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = 'جارِ الإرسال...';

    try {
      const saved = await Api.createRequest({
        title:          data.title,
        neighborhoodId: data.neighborhoodId,
        serviceTypeId:  data.serviceTypeId,
        description:    data.description,
        attachment:     data.attachment || null
      });

      Validator.alert(form, `تم إرسال الطلب بنجاح، رقم الطلب: ${saved.id}`, 'success');
      form.reset();
      form.querySelectorAll('.input-box').forEach(b => b.classList.remove('is-valid', 'is-invalid'));

      setTimeout(() => { window.location.href = 'my-requests.html'; }, 1600);

    } catch (err) {
      Validator.alert(form, err.message, 'error');
    } finally {
      btn.disabled = false; btn.textContent = 'إرسال';
    }
  });
}

/*  صفحة الطلبات السابقة  */
async function myRequests() {
  Session.guard();
  const tbody  = document.getElementById('requestsBody');
  const loader = document.getElementById('loader');
  const table  = document.getElementById('requestsTable');

  try {
    const [list, types] = await Promise.all([Api.getMyRequests(), Api.getServiceTypes()]);
    Ui.hide(loader);

    if (!list.length) {
      document.getElementById('emptyState').classList.remove('is-hidden');
      return;
    }

    Ui.show(table);
    const typeName = (id) => types.find(t => t.id === id)?.name || '—';

    tbody.innerHTML = list.map((r, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${Ui.escape(r.title)}</td>
        <td>${Ui.escape(typeName(r.serviceTypeId))}</td>
        <td><a class="btn-view" href="request-details.html?id=${r.id}">عرض</a></td>
      </tr>
    `).join('');

  } catch (err) {
    Ui.hide(loader);
    document.getElementById('emptyState').textContent = err.message;
    document.getElementById('emptyState').classList.remove('is-hidden');
  }
}

/*  صفحة تفاصيل الطلب */
async function requestDetails() {
  Session.guard();
  const card   = document.getElementById('detailCard');
  const loader = document.getElementById('loader');
  const id     = Ui.param('id');

  try {
    const [req, hoods, types] = await Promise.all([
      Api.getRequest(id), Api.getNeighborhoods(), Api.getServiceTypes()
    ]);
    Ui.hide(loader);

    if (!req) { card.innerHTML = '<p class="empty-state">الطلب غير موجود.</p>'; Ui.show(card); return; }

    const hood = hoods.find(h => h.id === req.neighborhoodId);
    const type = types.find(t => t.id === req.serviceTypeId);

    document.getElementById('reqNo').textContent    = req.id;
    document.getElementById('reqTitle').textContent = req.title;
    document.getElementById('reqType').textContent  = type?.name || '—';
    document.getElementById('reqTypeIcon').textContent = type?.icon || '🌳';
    document.getElementById('reqHood').textContent  = hood ? `حي ${hood.name}` : '—';
    document.getElementById('reqDesc').textContent  = req.description || 'لا يوجد وصف.';
    document.getElementById('reqFiles').innerHTML   = req.attachment
      ? `<a href="${FILES_URL}/${encodeURIComponent(req.attachment)}" target="_blank">${Ui.escape(req.attachment)}</a>`
      : '<span class="empty-state">لا توجد مرفقات.</span>';

    Ui.show(card);

  } catch (err) {
    Ui.hide(loader);
    card.innerHTML = `<p class="empty-state">${Ui.escape(err.message)}</p>`;
    Ui.show(card);
  }
}
