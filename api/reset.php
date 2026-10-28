<?php
// Page opened from the password-reset email: set a new password.
declare(strict_types=1);
require __DIR__ . '/lib.php';

$token = (string)($_GET['t'] ?? $_POST['t'] ?? '');
$hash = hash('sha256', $token);
$st = db()->prepare('SELECT uid FROM resets WHERE token = ? AND expires > ?');
$st->execute([$hash, time()]);
$uid = $token !== '' ? $st->fetchColumn() : false;

$msg = '';
$done = false;
if ($uid && $_SERVER['REQUEST_METHOD'] === 'POST') {
  $pw = (string)($_POST['pw'] ?? '');
  if (strlen($pw) < 8) $msg = 'Mật khẩu cần ít nhất 8 ký tự.';
  elseif ($pw !== (string)($_POST['pw2'] ?? '')) $msg = 'Hai mật khẩu chưa khớp.';
  else {
    db()->prepare('UPDATE users SET pass = ? WHERE uid = ?')->execute([password_hash($pw, PASSWORD_DEFAULT), $uid]);
    db()->prepare('DELETE FROM resets WHERE uid = ?')->execute([$uid]);
    $done = true;
  }
}
$h = fn($s) => htmlspecialchars((string)$s, ENT_QUOTES);
header('Content-Type: text/html; charset=utf-8');
header('Referrer-Policy: no-referrer');
?><!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Đặt lại mật khẩu – Style by BaoAnh Closet</title>
<link rel="stylesheet" href="../css/style.css">
<style>.box{max-width:420px;margin:48px auto;padding:0 16px}.box h1{font-size:28px;margin-bottom:16px}.box .btn{width:100%;margin-top:8px}</style>
</head><body><main class="box">
<h1>Đặt lại mật khẩu</h1>
<?php if ($done): ?>
  <p>Đã đổi mật khẩu. Bạn có thể đăng nhập bằng mật khẩu mới.</p>
  <a class="btn btn-primary" href="../account.html">Đăng nhập</a>
<?php elseif (!$uid): ?>
  <p>Link không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu link mới.</p>
  <a class="btn btn-outline" href="../account.html#forgot">Gửi lại link</a>
<?php else: ?>
  <form method="post">
    <input type="hidden" name="t" value="<?= $h($token) ?>">
    <div class="field"><label for="pw">Mật khẩu mới</label><input id="pw" name="pw" type="password" minlength="8" autocomplete="new-password" required></div>
    <div class="field"><label for="pw2">Nhập lại mật khẩu</label><input id="pw2" name="pw2" type="password" minlength="8" autocomplete="new-password" required></div>
    <?php if ($msg): ?><p class="form-error"><?= $h($msg) ?></p><?php endif; ?>
    <button class="btn btn-primary" type="submit">Lưu mật khẩu</button>
  </form>
<?php endif; ?>
</main></body></html>
