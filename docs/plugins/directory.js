document.querySelectorAll('[data-copy]').forEach(button => {
  button.addEventListener('click', async () => {
    const status = document.getElementById('copy-status');
    try {
      await navigator.clipboard.writeText(button.closest('.copybox').querySelector('code').textContent);
      status.textContent = '已复制 / Copied';
    } catch {
      status.textContent = '复制失败，请手动选择命令 / Select the command to copy';
    }
  });
});
