const emailService = require('../utils/email');

emailService.sendEmail(
  '3653762083@qq.com',
  '测试邮件',
  '<h1>这是一封测试邮件</h1><p>邮件内容</p>'
).then(result => {
  if (result.success) {
    console.log('邮件发送成功');
  } else {
    console.log('邮件发送失败:', result.error);
  }
});
