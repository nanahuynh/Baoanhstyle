<?php
// Shared server code: config, database, session, access rules.
declare(strict_types=1);

const COLLECTIONS = ['orders', 'users', 'reviews', 'returns', 'inventory', 'ledger'];
const MAX_DOC_BYTES = 200000;

function config(): array {
  static $cfg = null;
  if ($cfg === null) {
    $file = __DIR__ . '/config.php';
    if (!is_file($file)) fail('server-not-configured', 'Thiếu file api/config.php (copy từ config.sample.php).', 500);
    $cfg = require $file;
  }
  return $cfg;
}

function db(): PDO {
  static $pdo = null;
  if ($pdo) return $pdo;
  $c = config()['db'];
  if (str_starts_with($c['dsn'], 'sqlite:')) {
    $dir = dirname(substr($c['dsn'], 7));
    if (!is_dir($dir)) mkdir($dir, 0700, true);
  }
  $pdo = new PDO($c['dsn'], $c['user'] ?? null, $c['pass'] ?? null, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
  ]);
  foreach ([
    'CREATE TABLE IF NOT EXISTS docs (col VARCHAR(40) NOT NULL, id VARCHAR(120) NOT NULL, data MEDIUMTEXT NOT NULL, created VARCHAR(40) NOT NULL, PRIMARY KEY (col, id))',
    'CREATE TABLE IF NOT EXISTS users (uid VARCHAR(40) PRIMARY KEY, email VARCHAR(190) NOT NULL UNIQUE, pass VARCHAR(255) NOT NULL, name VARCHAR(190) NOT NULL, created VARCHAR(40) NOT NULL)',
    'CREATE TABLE IF NOT EXISTS resets (token VARCHAR(64) PRIMARY KEY, uid VARCHAR(40) NOT NULL, expires INT NOT NULL)',
    'CREATE TABLE IF NOT EXISTS fails (ip VARCHAR(64) NOT NULL, ts INT NOT NULL)',
  ] as $sql) $pdo->exec($sql);
  return $pdo;
}

function now(): string { return gmdate('Y-m-d\TH:i:s.v\Z'); }
function new_id(int $len = 20): string {
  $abc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  $s = '';
  for ($i = 0; $i < $len; $i++) $s .= $abc[random_int(0, 61)];
  return $s;
}

function out(array $data): never {
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store');
  echo json_encode($data, JSON_UNESCAPED_UNICODE);
  exit;
}
function fail(string $code, string $message = '', int $http = 400): never {
  http_response_code($http);
  out(['error' => ['code' => $code, 'message' => $message ?: $code]]);
}
function denied(): never { fail('permission-denied', 'Không có quyền.', 403); }

// ---------- session / current user ----------
function start_session(): void {
  session_name('baoanh_sid');
  session_set_cookie_params([
    'lifetime' => 60 * 60 * 24 * 30, 'path' => '/', 'httponly' => true, 'samesite' => 'Lax',
    'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
  ]);
  ini_set('session.gc_maxlifetime', (string)(60 * 60 * 24 * 30));
  session_start();
}

function admin_emails(): array { return array_map('strtolower', array_keys(config()['admins'] ?? [])); }
function is_admin_email(string $email): bool { return in_array(strtolower($email), admin_emails(), true); }

// The signed-in user as the browser sees it, or null.
function me(): ?array {
  $uid = $_SESSION['uid'] ?? null;
  if (!$uid) return null;
  if (str_starts_with($uid, 'admin:')) {
    $email = substr($uid, 6);
    if (!is_admin_email($email)) return null;   // removed from config since signing in
    return ['uid' => $uid, 'email' => $email, 'displayName' => 'Quản trị', 'admin' => true, 'created' => null];
  }
  $st = db()->prepare('SELECT uid, email, name, created FROM users WHERE uid = ?');
  $st->execute([$uid]);
  $u = $st->fetch();
  if (!$u) return null;
  return ['uid' => $u['uid'], 'email' => $u['email'], 'displayName' => $u['name'], 'admin' => false, 'created' => $u['created']];
}

// ---------- login throttling ----------
function client_ip(): string { return substr($_SERVER['REMOTE_ADDR'] ?? 'unknown', 0, 64); }
function throttle_check(): void {
  $db = db();
  $db->prepare('DELETE FROM fails WHERE ts < ?')->execute([time() - 900]);
  $st = $db->prepare('SELECT COUNT(*) FROM fails WHERE ip = ?');
  $st->execute([client_ip()]);
  if ((int)$st->fetchColumn() >= 10) fail('auth/too-many-requests', '', 429);
}
function throttle_fail(): void {
  db()->prepare('INSERT INTO fails (ip, ts) VALUES (?, ?)')->execute([client_ip(), time()]);
}

// ---------- documents ----------
function get_doc(string $col, string $id): ?array {
  $st = db()->prepare('SELECT data FROM docs WHERE col = ? AND id = ?');
  $st->execute([$col, $id]);
  $row = $st->fetch();
  return $row ? json_decode($row['data'], true) : null;
}
function all_docs(string $col): array {
  $st = db()->prepare('SELECT id, data FROM docs WHERE col = ?');
  $st->execute([$col]);
  $out = [];
  foreach ($st->fetchAll() as $r) $out[] = ['id' => $r['id'], 'data' => json_decode($r['data'], true)];
  return $out;
}
function put_doc(string $col, string $id, array $data, bool $isNew): void {
  $json = json_encode($data, JSON_UNESCAPED_UNICODE);
  if (strlen($json) > MAX_DOC_BYTES) fail('invalid-argument', 'Dữ liệu quá lớn.');
  if ($isNew) {
    db()->prepare('INSERT INTO docs (col, id, data, created) VALUES (?, ?, ?, ?)')->execute([$col, $id, $json, now()]);
  } else {
    db()->prepare('UPDATE docs SET data = ? WHERE col = ? AND id = ?')->execute([$json, $col, $id]);
  }
}
function remove_doc(string $col, string $id): void {
  db()->prepare('DELETE FROM docs WHERE col = ? AND id = ?')->execute([$col, $id]);
}

// Replace {"__sv":"now"} placeholders (serverTimestamp) with the current time.
function resolve_values(mixed $v): mixed {
  if (is_array($v)) {
    if (($v['__sv'] ?? null) === 'now' && count($v) === 1) return now();
    foreach ($v as $k => $x) $v[$k] = resolve_values($x);
  }
  return $v;
}
// Apply an update whose keys may be dotted paths ("history.new").
function apply_update(array $doc, array $patch): array {
  foreach ($patch as $path => $value) {
    $keys = explode('.', (string)$path);
    $ref = &$doc;
    foreach (array_slice($keys, 0, -1) as $k) {
      if (!isset($ref[$k]) || !is_array($ref[$k])) $ref[$k] = [];
      $ref = &$ref[$k];
    }
    $ref[end($keys)] = $value;
    unset($ref);
  }
  return $doc;
}

// ---------- access rules (same as the old firestore.rules) ----------
function delivered_to(?array $user, $orderId): bool {
  if (!$user || !is_string($orderId) || $orderId === '') return false;
  $o = get_doc('orders', $orderId);
  return $o && ($o['uid'] ?? null) === $user['uid'] && ($o['status'] ?? null) === 'done';
}

function can_read(?array $user, string $col, string $id, ?array $doc): bool {
  $admin = $user && $user['admin'];
  if ($admin) return true;
  return match ($col) {
    'reviews' => true,
    'orders', 'returns' => $user && $doc && ($doc['uid'] ?? null) === $user['uid'],
    'users' => $user && $id === $user['uid'],
    default => false,
  };
}

// Checks a create; may adjust the stored data (server sets createdAt).
function check_create(?array $user, string $col, string $id, array $d, bool $exists): array {
  $admin = $user && $user['admin'];
  switch ($col) {
    case 'orders':
      if (($d['status'] ?? null) !== 'new' || ($d['stockApplied'] ?? null) !== false) denied();
      if (!is_array($d['items'] ?? null) || !array_is_list($d['items']) || count($d['items']) < 1 || count($d['items']) > 50) denied();
      $uid = $d['uid'] ?? null;
      if ($uid !== null && (!$user || $uid !== $user['uid'])) denied();
      $d['createdAt'] = now();
      return $d;
    case 'users':
      if (!$user || $id !== $user['uid']) denied();
      return $d;
    case 'reviews':
      if (!$user || $exists || ($d['uid'] ?? null) !== $user['uid']) denied();
      if ($id !== ($d['orderId'] ?? '') . '_' . ($d['productId'] ?? '')) denied();
      if (!delivered_to($user, $d['orderId'] ?? null)) denied();
      if (!is_int($d['rating'] ?? null) || $d['rating'] < 1 || $d['rating'] > 5) denied();
      if (!is_string($d['text'] ?? null) || mb_strlen($d['text']) > 1500) denied();
      $d['createdAt'] = now();
      return $d;
    case 'returns':
      if (!$user || ($d['uid'] ?? null) !== $user['uid'] || ($d['status'] ?? null) !== 'requested') denied();
      if (!delivered_to($user, $d['orderId'] ?? null)) denied();
      $d['createdAt'] = now();
      return $d;
    case 'inventory': case 'ledger':
      if (!$admin) denied();
      return $d;
  }
  denied();
}

function can_update(?array $user, string $col, string $id): bool {
  if ($user && $user['admin']) return in_array($col, ['orders', 'returns', 'inventory', 'ledger', 'users'], true);
  return $col === 'users' && $user && $id === $user['uid'];
}
function can_delete(?array $user, string $col): bool {
  return $user && $user['admin'] && in_array($col, ['orders', 'reviews', 'inventory', 'ledger'], true);
}
