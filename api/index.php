<?php
// JSON API used by js/server/*.js.  POST api/?a=<action> with a JSON body.
declare(strict_types=1);
require __DIR__ . '/lib.php';

set_exception_handler(function (Throwable $e) {
  error_log('[baoanh api] ' . $e);
  fail('internal', 'Lỗi server.', 500);
});

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('method', 'POST only', 405);
// Browsers cannot send this header cross-site without a CORS preflight we never answer → blocks CSRF.
if (($_SERVER['HTTP_X_BAOANH'] ?? '') !== '1') denied();

$in = json_decode(file_get_contents('php://input') ?: '{}', true);
if (!is_array($in)) fail('invalid-argument', 'Bad JSON');

start_session();
$user = me();
$action = $_GET['a'] ?? '';

function col_arg(array $in): string {
  $col = $in['col'] ?? '';
  if (!in_array($col, COLLECTIONS, true)) fail('invalid-argument', 'Unknown collection');
  return $col;
}
function id_arg(array $in): string {
  $id = $in['id'] ?? '';
  if (!is_string($id) || $id === '' || strlen($id) > 120 || str_contains($id, '/')) fail('invalid-argument', 'Bad id');
  return $id;
}
function data_arg(array $in): array {
  $d = $in['data'] ?? null;
  if (!is_array($d) || ($d !== [] && array_is_list($d))) fail('invalid-argument', 'Bad data');
  return resolve_values($d);
}
function public_user(?array $u): ?array {
  if (!$u) return null;
  return ['uid' => $u['uid'], 'email' => $u['email'], 'displayName' => $u['displayName'], 'admin' => $u['admin'], 'created' => $u['created']];
}
function sign_in_as(string $uid): void {
  session_regenerate_id(true);
  $_SESSION['uid'] = $uid;
}

// Writes shared by single calls and batches.
function do_set(?array $user, string $col, string $id, array $data, bool $merge): void {
  $cur = get_doc($col, $id);
  if ($cur === null) {
    put_doc($col, $id, check_create($user, $col, $id, $data, false), true);
  } else {
    if (!can_update($user, $col, $id)) denied();
    put_doc($col, $id, $merge ? apply_update($cur, $data) : $data, false);
  }
}
function do_update(?array $user, string $col, string $id, array $data): void {
  $cur = get_doc($col, $id);
  if ($cur === null) fail('not-found', 'Không tìm thấy.', 404);
  if (!can_update($user, $col, $id)) denied();
  put_doc($col, $id, apply_update($cur, $data), false);
}
function do_delete(?array $user, string $col, string $id): void {
  if (!can_delete($user, $col)) denied();
  remove_doc($col, $id);
}

switch ($action) {
  // ---------- accounts ----------
  case 'me':
    out(['user' => public_user($user)]);

  case 'signin': {
    throttle_check();
    $email = strtolower(trim((string)($in['email'] ?? '')));
    $pw = (string)($in['password'] ?? '');
    foreach (config()['admins'] ?? [] as $aEmail => $aPw) {
      if (strtolower($aEmail) === $email) {
        // the sample password (public on GitHub) and short passwords never work
        $usable = strlen((string)$aPw) >= 8 && $aPw !== 'doi-mat-khau-nay';
        if ($usable && hash_equals((string)$aPw, $pw)) { sign_in_as('admin:' . $email); out(['user' => public_user(me())]); }
        throttle_fail();
        fail('auth/invalid-credential');
      }
    }
    $st = db()->prepare('SELECT uid, pass FROM users WHERE email = ?');
    $st->execute([$email]);
    $row = $st->fetch();
    if (!$row || !password_verify($pw, $row['pass'])) { throttle_fail(); fail('auth/invalid-credential'); }
    sign_in_as($row['uid']);
    out(['user' => public_user(me())]);
  }

  case 'signup': {
    throttle_check();
    $email = strtolower(trim((string)($in['email'] ?? '')));
    $pw = (string)($in['password'] ?? '');
    $name = trim((string)($in['name'] ?? ''));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 190) fail('auth/invalid-email');
    if (strlen($pw) < 8) fail('auth/weak-password');
    if (is_admin_email($email)) fail('auth/email-already-in-use');
    $st = db()->prepare('SELECT 1 FROM users WHERE email = ?');
    $st->execute([$email]);
    if ($st->fetch()) { throttle_fail(); fail('auth/email-already-in-use'); }
    $uid = new_id(28);
    db()->prepare('INSERT INTO users (uid, email, pass, name, created) VALUES (?, ?, ?, ?, ?)')
      ->execute([$uid, $email, password_hash($pw, PASSWORD_DEFAULT), mb_substr($name, 0, 190), now()]);
    sign_in_as($uid);
    out(['user' => public_user(me())]);
  }

  case 'signout':
    $_SESSION = [];
    session_destroy();
    out(['user' => null]);

  case 'profile': {
    if (!$user || $user['admin']) denied();
    $name = mb_substr(trim((string)($in['displayName'] ?? '')), 0, 190);
    db()->prepare('UPDATE users SET name = ? WHERE uid = ?')->execute([$name, $user['uid']]);
    out(['user' => public_user(me())]);
  }

  case 'reset': {
    // Always answers ok, so nobody can probe which emails have accounts.
    throttle_check();
    $email = strtolower(trim((string)($in['email'] ?? '')));
    $st = db()->prepare('SELECT uid FROM users WHERE email = ?');
    $st->execute([$email]);
    $uid = $st->fetchColumn();
    if ($uid) {
      $token = bin2hex(random_bytes(24));
      db()->prepare('INSERT INTO resets (token, uid, expires) VALUES (?, ?, ?)')->execute([hash('sha256', $token), $uid, time() + 3600]);
      // fixed site address: never build the link from the request's Host header (it can be forged)
      $site = rtrim(config()['site_url'] ?? 'https://www.stylebybaoanh.com', '/');
      $link = $site . '/api/reset.php?t=' . $token;
      $from = config()['mail_from'] ?? 'no-reply@stylebybaoanh.com';
      $subject = '=?UTF-8?B?' . base64_encode('Đặt lại mật khẩu – Style by BaoAnh Closet') . '?=';
      $body = "Chào bạn,\n\nBấm link dưới đây để đặt mật khẩu mới (link dùng được trong 1 giờ):\n$link\n\n"
        . "Nếu bạn không yêu cầu, hãy bỏ qua email này.\n\nStyle by BaoAnh Closet";
      @mail($email, $subject, $body, "From: Style by BaoAnh Closet <$from>\r\nContent-Type: text/plain; charset=UTF-8");
    } else {
      throttle_fail();
    }
    out(['ok' => true]);
  }

  // ---------- documents ----------
  case 'get': {
    $col = col_arg($in); $id = id_arg($in);
    $doc = get_doc($col, $id);
    if (!can_read($user, $col, $id, $doc)) denied();
    out(['doc' => $doc === null ? null : ['id' => $id, 'data' => $doc]]);
  }

  case 'list': {
    $col = col_arg($in);
    $admin = $user && $user['admin'];
    if (!$admin && !in_array($col, ['orders', 'returns', 'reviews'], true)) denied();
    $docs = all_docs($col);
    // customers only ever see their own orders / returns
    if (!$admin && $col !== 'reviews') {
      if (!$user) denied();
      $docs = array_values(array_filter($docs, fn($d) => ($d['data']['uid'] ?? null) === $user['uid']));
    }
    foreach ((array)($in['where'] ?? []) as $w) {
      [$f, $v] = [$w[0] ?? '', $w[1] ?? null];
      $docs = array_values(array_filter($docs, fn($d) => ($d['data'][$f] ?? null) === $v));
    }
    if (!empty($in['orderBy'])) {
      [$f, $dir] = [$in['orderBy'][0] ?? '', $in['orderBy'][1] ?? 'asc'];
      usort($docs, fn($a, $b) => ($dir === 'desc' ? -1 : 1) * strcmp((string)($a['data'][$f] ?? ''), (string)($b['data'][$f] ?? '')));
    }
    out(['docs' => $docs]);
  }

  case 'add': {
    $col = col_arg($in);
    $id = new_id();
    put_doc($col, $id, check_create($user, $col, $id, data_arg($in), false), true);
    out(['id' => $id]);
  }

  case 'set': {
    $col = col_arg($in); $id = id_arg($in);
    db()->beginTransaction();
    do_set($user, $col, $id, data_arg($in), !empty($in['merge']));
    db()->commit();
    out(['ok' => true]);
  }

  case 'update':
    do_update($user, col_arg($in), id_arg($in), data_arg($in));
    out(['ok' => true]);

  case 'delete':
    do_delete($user, col_arg($in), id_arg($in));
    out(['ok' => true]);

  case 'batch': {
    // used by runTransaction (admin): all writes succeed or none do
    if (!$user || !$user['admin']) denied();
    $ops = $in['ops'] ?? [];
    if (!is_array($ops) || count($ops) > 200) fail('invalid-argument', 'Bad ops');
    db()->beginTransaction();
    foreach ($ops as $op) {
      $col = col_arg($op); $id = id_arg($op);
      match ($op['op'] ?? '') {
        'set' => do_set($user, $col, $id, data_arg($op), !empty($op['merge'])),
        'update' => do_update($user, $col, $id, data_arg($op)),
        'delete' => do_delete($user, $col, $id),
        default => fail('invalid-argument', 'Bad op'),
      };
    }
    db()->commit();
    out(['ok' => true]);
  }
}
fail('invalid-argument', 'Unknown action', 404);
