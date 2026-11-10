document.querySelectorAll('[data-copy]').forEach(button => {
  button.addEventListener('click', async () => {
    const box = button.closest('.codebox');
    const status = box.querySelector('.copy-status');
    const chinese = document.documentElement.lang.startsWith('zh');
    try {
      await navigator.clipboard.writeText(box.querySelector('code').textContent);
      status.textContent = chinese ? '命令已复制。' : 'Commands copied.';
    } catch {
      status.textContent = chinese ? '无法访问剪贴板，请手动选择命令。' : 'Clipboard unavailable. Select the commands manually.';
    }
  });
});
