<?php
require __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') fail('طريقة الطلب غير مدعومة.', 405);

require_login();

$rows = db()->query('SELECT id, name, icon FROM service_types ORDER BY id')->fetchAll();

json_out(array_map(function ($r) {
  return ['id' => (int) $r['id'], 'name' => $r['name'], 'icon' => $r['icon']];
}, $rows));
