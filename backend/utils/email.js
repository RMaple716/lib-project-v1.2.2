const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// 添加调试信息
console.log('当前工作目录:', process.cwd());
console.log('环境变量文件路径:', path.join(__dirname, '../.env'));
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '已设置' : '未设置');

const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('环境变量状态:', {
        EMAIL_USER: process.env.EMAIL_USER,
        EMAIL_PASS: process.env.EMAIL_PASS ? '已设置' : '未设置'
      });
      throw new Error('缺少必要的邮件配置环境变量');
    }

    this.transporter = nodemailer.createTransport({
      host: 'smtp.qq.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  async sendEmail(to, subject, content) {
    try {
      const info = await this.transporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: subject,
        html: content
      });
      
      console.log('邮件发送成功:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('邮件发送失败:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();
