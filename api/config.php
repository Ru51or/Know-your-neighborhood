<?php
/*  بيانات الاتصال بقاعدة البيانات  */
define('DB_HOST', 'localhost');
define('DB_NAME', 'aarif_hayak');
define('DB_USER', 'root');
define('DB_PASS', '');         

/*  السماح للواجهة بالاتصال بالخادم  */
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

/*  فتح الاتصال بقاعدة البيانات  */
function db() {
  static $pdo = null;
  if ($pdo === null) {
    try {
      $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER, DB_PASS,
        [
          PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
          PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
          PDO::ATTR_EMULATE_PREPARES   => false
        ]
      );
    } catch (PDOException $e) {
      fail('تعذّر الاتصال بقاعدة البيانات.', 500);
    }
  }
  return $pdo;
}

/*  دوال الإرجاع  */
function json_out($data, $code = 200) {
  http_response_code($code);
  echo json_encode($data, JSON_UNESCAPED_UNICODE);
  exit;
}

function fail($message, $code = 400) {
  json_out(['message' => $message], $code);
}

/* قراءة الجسم عندما يكون JSON  */
function body_json() {
  $raw = file_get_contents('php://input');
  $data = json_decode($raw, true);
  return is_array($data) ? $data : [];
}

/* Authorization: Bearer <token> */
function bearer_token() {
  $header = '';
  if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
    $header = $_SERVER['HTTP_AUTHORIZATION'];
  } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
    $header = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
  } elseif (function_exists('getallheaders')) {
    foreach (getallheaders() as $key => $value) {
      if (strtolower($key) === 'authorization') { $header = $value; break; }
    }
  }
  if (preg_match('/Bearer\s+(.*)$/i', $header, $m)) return trim($m[1]);
  return '';
}

/* يرجّع بيانات المستخدم الحالي أو يوقف التنفيذ برسالة 401 */
function require_login() {
  $token = bearer_token();
  if ($token === '') fail('انتهت الجلسة، الرجاء تسجيل الدخول من جديد.', 401);

  $stmt = db()->prepare('SELECT id, username, full_name FROM users WHERE api_token = ? LIMIT 1');
  $stmt->execute([$token]);
  $user = $stmt->fetch();

  if (!$user) fail('انتهت الجلسة، الرجاء تسجيل الدخول من جديد.', 401);
  return $user;
}
