<?php

require __DIR__ . '/config.php';

$user = require_login();

/* arraing */
function map_request($row) {
  return [
    'id'             => (int) $row['id'],
    'userId'         => (int) $row['user_id'],
    'title'          => $row['title'],
    'neighborhoodId' => (int) $row['neighborhood_id'],
    'serviceTypeId'  => (int) $row['service_type_id'],
    'description'    => $row['description'],
    'attachment'     => $row['attachment'],
    'status'         => $row['status'],
    'createdAt'      => $row['created_at']
  ];
}

/* (GET) */
if ($_SERVER['REQUEST_METHOD'] === 'GET') {

  /* تفاصيل طلب واحد */
  if (isset($_GET['id'])) {
    $stmt = db()->prepare('SELECT * FROM requests WHERE id = ? AND user_id = ? LIMIT 1');
    $stmt->execute([(int) $_GET['id'], $user['id']]);
    $row = $stmt->fetch();
    if (!$row) fail('الطلب غير موجود.', 404);
    json_out(map_request($row));
  }

  /* قائمة طلبات المستخدم الحالي */
  $stmt = db()->prepare('SELECT * FROM requests WHERE user_id = ? ORDER BY id DESC');
  $stmt->execute([$user['id']]);
  json_out(array_map('map_request', $stmt->fetchAll()));
}

/* (POST)*/
if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('طريقة الطلب غير مدعومة.', 405);

$title          = trim($_POST['title'] ?? '');
$neighborhoodId = $_POST['neighborhoodId'] ?? '';
$serviceTypeId  = $_POST['serviceTypeId'] ?? '';
$description    = trim($_POST['description'] ?? '');

/* (Server-side Validation)*/
$errors = [];

if ($title === '')                       $errors[] = 'حقل «عنوان الطلب» مطلوب.';
elseif (mb_strlen($title) < 5)           $errors[] = '«عنوان الطلب» يجب أن لا يقل عن 5 حروف.';
elseif (mb_strlen($title) > 60)          $errors[] = '«عنوان الطلب» يجب أن لا يزيد عن 60 حرف.';
elseif (ctype_digit($title))             $errors[] = '«عنوان الطلب» لا يمكن أن يكون أرقامًا فقط.';

if ($description === '')                 $errors[] = 'حقل «وصف الطلب» مطلوب.';
elseif (mb_strlen($description) < 10)    $errors[] = '«وصف الطلب» يجب أن لا يقل عن 10 حروف.';
elseif (mb_strlen($description) > 500)   $errors[] = '«وصف الطلب» يجب أن لا يزيد عن 500 حرف.';
elseif (ctype_digit($description))       $errors[] = '«وصف الطلب» لا يمكن أن يكون أرقامًا فقط.';

/* التأكد أن الحي ونوع الخدمة موجودان فعلًا في الجداول */
$hoodOk = false;
if ($neighborhoodId !== '') {
  $s = db()->prepare('SELECT 1 FROM neighborhoods WHERE id = ?');
  $s->execute([(int) $neighborhoodId]);
  $hoodOk = (bool) $s->fetchColumn();
}
if (!$hoodOk) $errors[] = 'الرجاء اختيار «الحي» من القائمة.';

$typeOk = false;
if ($serviceTypeId !== '') {
  $s = db()->prepare('SELECT 1 FROM service_types WHERE id = ?');
  $s->execute([(int) $serviceTypeId]);
  $typeOk = (bool) $s->fetchColumn();
}
if (!$typeOk) $errors[] = 'الرجاء اختيار «نوع الخدمة» من القائمة.';

if ($errors) fail($errors[0], 422);

/* رفع المرفق */
$savedName = null;

if (isset($_FILES['attachment']) && $_FILES['attachment']['error'] !== UPLOAD_ERR_NO_FILE) {
  $file = $_FILES['attachment'];

  if ($file['error'] !== UPLOAD_ERR_OK) fail('تعذّر رفع المرفق، حاول مرة أخرى.', 400);

  $allowed = ['pdf', 'jpg', 'jpeg', 'png'];
  $ext     = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

  if (!in_array($ext, $allowed, true))
    fail('«المرفق» يقبل الملفات من نوع: pdf، jpg، jpeg، png فقط.', 422);

  if ($file['size'] > 5 * 1024 * 1024)
    fail('حجم «المرفق» يجب أن لا يتجاوز 5 ميجابايت.', 422);

  /* اسم جديد عشوائي */
  $savedName = 'req_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
  $dir       = __DIR__ . '/uploads';
  if (!is_dir($dir)) mkdir($dir, 0777, true);

  if (!move_uploaded_file($file['tmp_name'], $dir . '/' . $savedName))
    fail('تعذّر حفظ المرفق على الخادم.', 500);
}

/*  الحفظ في جدول الطلبات */
$stmt = db()->prepare(
  'INSERT INTO requests (user_id, title, neighborhood_id, service_type_id, description, attachment, status, created_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
);
$stmt->execute([
  $user['id'], $title, (int) $neighborhoodId, (int) $serviceTypeId,
  $description, $savedName, 'قيد المراجعة', date('Y-m-d')
]);

$newId = (int) db()->lastInsertId();

$stmt = db()->prepare('SELECT * FROM requests WHERE id = ?');
$stmt->execute([$newId]);

json_out(map_request($stmt->fetch()), 201);
