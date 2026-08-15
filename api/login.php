<?php

require __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('طريقة الطلب غير مدعومة.', 405);

$input    = body_json();
$username = trim($input['username'] ?? '');
$password = $input['password'] ?? '';

/* التحقق من جهة الخادم */
if ($username === '' || $password === '') {
  fail('اسم المستخدم والرمز السري مطلوبان.', 422);
}

$stmt = db()->prepare('SELECT id, username, password, full_name FROM users WHERE username = ? LIMIT 1');
$stmt->execute([$username]);
$user = $stmt->fetch();

/* نفس الرسالة في الحالتين حتى لا نكشف أي أسماء المستخدمين موجودة */
if (!$user || !password_verify($password, $user['password'])) {
  fail('اسم المستخدم أو الرمز السري غير صحيح.', 401);
}

/* توليد توكن جديد وحفظه في جدول المستخدمين */
$token = bin2hex(random_bytes(32));
db()->prepare('UPDATE users SET api_token = ? WHERE id = ?')->execute([$token, $user['id']]);

json_out([
  'user' => [
    'id'       => (int) $user['id'],
    'username' => $user['username'],
    'fullName' => $user['full_name']
  ],
  'token' => $token
]);
