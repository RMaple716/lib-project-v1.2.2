<template>
  <div class="home-view">
    <GlobalMessage ref="globalMessage" />
    <div class="login-register-container">
      <div class="container">
        <!-- 登录表单 -->
        <form 
          id="loginForm" 
          class="form" 
          :class="{ active: activeForm === 'login', hidden: activeForm !== 'login' }"
          @submit.prevent="handleLogin"
        >
          <h2><i class="fas fa-book"></i> 用户登录</h2>
          <div class="form-group">
            <input 
              type="text" 
              id="loginAccount" 
              v-model="loginForm.account"
              placeholder=" "
              required
            >
            <label for="loginAccount">账号</label>
          </div>
          <div class="form-group">
            <input 
              type="password" 
              id="loginPassword" 
              v-model="loginForm.password"
              placeholder=" " 
              required
            >
            <label for="loginPassword">密码</label>
          </div>
          <div class="form-group">
            <select id="loginUserType" v-model="loginForm.userType">
              <option value="student">学生</option>
              <option value="teacher">教师</option>
              <option value="terminal_admin">终端管理员</option>
              <option value="book_admin">图书管理员</option>
              <option value="borrow_admin">借阅管理员</option>
            </select>
          </div>
          <div class="remember-me">
            <input type="checkbox" id="remember" v-model="rememberMe"/>
            <label for="remember">记住我</label>
          </div>
          <button type="submit">登录</button>
          <p class="toggle-form">没有账号？ 
            <a href="#" @click.prevent="switchForm('register')">立即注册</a>
          </p>
        </form>

        <!-- 注册表单 -->
        <form 
          id="registerForm" 
          class="form" 
          :class="{ active: activeForm === 'register', hidden: activeForm !== 'register' }"
          @submit.prevent="handleRegister"
        >
          <h2><i class="fas fa-user-plus"></i> 用户注册</h2>
          <div class="form-group">
            <input 
              type="text" 
              id="registerAccount" 
              v-model="registerForm.account"
              placeholder=" " 
              required
            >
            <label for="registerAccount">账号</label>
          </div>
          <div class="form-group">
            <input 
              type="text" 
              id="registerName" 
              v-model="registerForm.name"
              placeholder=" " 
              required
            >
            <label for="registerName">姓名</label>
          </div>
          <div class="form-group">
            <input 
              type="email" 
              id="registerEmail" 
              v-model="registerForm.email"
              placeholder=" " 
              required
              @input="validateEmail"
            >
            <label for="registerEmail">邮箱</label>
          </div>
          <div class="form-group">
            <select id="registerUserType" v-model="registerForm.userType">
              <option value="student">学生</option>
              <option value="teacher">教师</option>
              <option value="terminal_admin">终端管理员</option>
              <option value="book_admin">图书管理员</option>
              <option value="borrow_admin">借阅管理员</option>
            </select>
          </div>
          <div class="form-group">
            <input 
              type="password" 
              id="registerPassword" 
              v-model="registerForm.password"
              placeholder=" " 
              required
              @input="checkPasswordStrength"
            >
            <label for="registerPassword">密码</label>
            <div class="password-strength">
              <span 
                class="strength-bar" 
                :style="{ backgroundColor: passwordStrength.bars[0] }"
              ></span>
              <span 
                class="strength-bar" 
                :style="{ backgroundColor: passwordStrength.bars[1] }"
              ></span>
              <span 
                class="strength-bar" 
                :style="{ backgroundColor: passwordStrength.bars[2] }"
              ></span>
              <span class="strength-text">{{ passwordStrength.text }}</span>
            </div>
          </div>
          <div class="form-group">
            <input 
              type="password" 
              id="confirmPassword" 
              v-model="registerForm.confirmPassword"
              placeholder=" " 
              required
              @input="checkPasswordMatch"
            >
            <label for="confirmPassword">确认密码</label>
            <span class="error-message" id="passwordError">{{ passwordError }}</span>
          </div>
          <button type="submit">注册</button>
          <p class="toggle-form">已有账号？ 
            <a href="#" @click.prevent="switchForm('login')">立即登录</a>
          </p>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import GlobalMessage from '../views/GlobalMessage.vue';
export default {
  name: 'HomeView',
  components: {
    GlobalMessage
  },
  data() {
    return {
      activeForm: 'login',
      rememberMe: false,
      loginForm: {
        account: '',
        password: '',
        userType: 'student'
      },
      registerForm: {
        account: '',
        name: '',
        email: '',
        userType: 'student',
        password: '',
        confirmPassword: ''
      },
      passwordError: '',
      passwordStrength: {
        bars: ['#eee', '#eee', '#eee'],
        text: ''
      }
    };
  },
  mounted() {
    // 记住我功能 - 从localStorage加载保存的用户信息
    const savedUser = localStorage.getItem('rememberedUser');
    if (savedUser) {
      const { account, userType } = JSON.parse(savedUser);
      this.loginForm.account = account;
      this.loginForm.userType = userType;
      this.rememberMe = true;
    }
  },
  methods: {
    // 显示消息的辅助方法
    showMessage(content, type = 'info', duration = 3000) {
      this.$refs.globalMessage.addMessage(content, type, duration);
    },
    getRoleDescription(role) {
      const descriptions = {
        student: '可以借阅图书',
        teacher: '可以借阅图书，借阅期限更长',
        terminal_admin: '系统终端管理',
        book_admin: '管理图书信息',
        borrow_admin: '管理借阅记录和用户'
      };
      return descriptions[role] || '';
    },

    switchForm(formType) {
      this.activeForm = formType;
    },
    
    checkPasswordMatch() {
      if (this.registerForm.password !== this.registerForm.confirmPassword) {
        this.passwordError = '两次输入的密码不一致';
      } else {
        this.passwordError = '';
      }
    },
    
    checkPasswordStrength() {
      const password = this.registerForm.password;
      let strength = 0;

      if (password.length >= 8) strength++;
      if (/[A-Z]/.test(password)) strength++;
      if (/[0-9]/.test(password)) strength++;
      if (/[^A-Za-z0-9]/.test(password)) strength++;

      // 更新密码强度条
      this.passwordStrength.bars = this.passwordStrength.bars.map((bar, index) => {
        return index < strength ? 
          ['#ff4757', '#ffa502', '#2ed573'][Math.min(strength - 1, 2)] : '#eee';
      });

      // 更新密码强度文本
      this.passwordStrength.text = ['弱', '中', '强', '很强'][Math.min(strength - 1, 3)] || '';
    },
    
    validateEmail() {
      const email = this.registerForm.email;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const emailInput = document.getElementById('registerEmail');
      
      if (email && !emailRegex.test(email)) {
        emailInput.setCustomValidity('请输入有效的邮箱地址');
        this.showMessage('请输入有效的邮箱地址', 'warning', 3000);
      } else {
        emailInput.setCustomValidity('');
      }
    },
    
    async handleLogin() {
      // 记住我功能
      if (this.rememberMe) {
        const user = {
          account: this.loginForm.account,
          userType: this.loginForm.userType
        };
        localStorage.setItem('rememberedUser', JSON.stringify(user));
      } else {
        localStorage.removeItem('rememberedUser');
      }

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            account: this.loginForm.account,
            password: this.loginForm.password,
            usertype: this.loginForm.userType
          })
        });
        
        const data = await res.json();
        
        if (res.status === 200) {
          this.showMessage('登录成功！', 'success', 2000);
          setTimeout(() => {
            // 根据API文档，用户类型字段是 usertype，且管理员类型为 admin_t, admin_b, admin_l
            if (['admin_t', 'admin_b', 'admin_l'].includes(data.data.usertype)) {
              this.$router.push('/manager2'); // 跳转到管理员页面
            } else if (['student', 'teacher'].includes(data.data.usertype)) {
              this.$router.push('/readers'); // 跳转到读者页面
            }
          }, 1500);
        } else if (res.status === 400) {
          if (data.errorCode === "4002") {
            this.showMessage(data.message || '用户不存在', 'error', 4000);
          } else if (data.errorCode === "4003") {
            this.showMessage(data.message || '密码错误', 'error', 4000);
          } else {
            this.showMessage(data.message || '登录失败', 'error', 4000);
          }
        }
      } catch (err) {
        console.error("捕获到错误：", err);
        console.log("错误类型：", err.name);
        console.log("错误消息：", err.message);
        if (err.stack) {
          console.log("错误堆栈：", err.stack);
        }
        this.showMessage('网络错误，请稍后再试。', 'error', 5000);
      }
    },
    
    async handleRegister() {
      // 确认密码一致性
      if (this.registerForm.password !== this.registerForm.confirmPassword) {
        this.passwordError = '请确认密码一致';
        this.showMessage('两次输入的密码不一致，请确认密码一致', 'warning', 4000);
        return;
      }
      
      // 检查密码强度
      if (this.registerForm.password.length < 6) {
        this.showMessage('密码强度不足，请设置更复杂的密码', 'warning', 4000);
        return;
      }

      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            account: this.registerForm.account,
            name: this.registerForm.name,
            email: this.registerForm.email,
            usertype: this.registerForm.userType,
            password: this.registerForm.password
          })
        });
        
        const data = await res.json();
        console.log(res.status);
        
        if (res.status === 200 && data.success) {
          this.showMessage(data.message || '注册成功！', 'success', 3000);
          // 延迟切换到登录表单，让用户看到成功消息
          setTimeout(() => {
            this.activeForm = 'login';
            this.loginForm.account = this.registerForm.account;
            this.loginForm.userType = this.registerForm.userType;
            this.loginForm.password = '';
            
            // 重置注册表单
            this.registerForm = {
              account: '',
              name: '',
              email: '',
              userType: 'student',
              password: '',
              confirmPassword: ''
            };
          }, 1500);
        } else {
          if (res.status === 400 && data.code === 1) {
            this.showMessage('用户已存在，请重新注册。', 'error', 5000);
          } else {
            this.showMessage(data.message || '注册失败', 'error', 5000);
          }
        }
      } catch (err) {
        console.log("错误类型：", err.name);
        console.log("错误消息：", err.message);
        if (err.stack) {
          console.log("错误堆栈：", err.stack);
        }
        this.showMessage('网络错误，请稍后再试', 'error', 5000);
      }
    }
  }
};
</script>

<style scoped>
.home-view {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  font-family: 'Arial', sans-serif;
  background-image: url('../../public/OIP-C.jpg');
  background-size: cover;
  background-position: center;
}

/* 登录注册容器样式 */
.login-register-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1;
}

.container {
  background: rgba(240, 255, 255, 0.95);
  padding: 2.5rem;
  border-radius: 20px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
  width: 450px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.form {
  transition: all 0.4s ease;
}

.form.active {
  display: block;
  animation: fadeIn 0.5s ease;
}

.form.hidden {
  display: none;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

h2 {
  color: #2E8B57;
  margin-bottom: 2rem;
  text-align: center;
  font-size: 1.8rem;
  font-weight: 600;
}

h2 i {
  margin-right: 10px;
  color: #20B2AA;
}

.form-group {
  position: relative;
  margin-bottom: 1.8rem;
}

input, select {
  width: 100%;
  padding: 1.2rem;
  border: 2px solid #AFEEEE;
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.3s ease;
  outline: none;
  box-sizing: border-box; 
}

input:focus, select:focus,
input:not(:placeholder-shown) {
  border-color: #20B2AA;
  box-shadow: 0 0 0 3px rgba(32, 178, 170, 0.1);
  background: white;
}

.form-group label {
  position: absolute;
  left: 1.2rem;
  top: 50%;
  transform: translateY(-50%);
  color: #008B8B;
  pointer-events: none;
  transition: all 0.3s ease;
  background: linear-gradient(transparent 50%, rgba(240, 255, 255, 0.95) 50%);
  padding: 0 0.5rem;
  font-weight: 500;
}

input:focus ~ label,
input:not(:placeholder-shown) ~ label {
  top: -0.8rem;
  font-size: 0.85rem;
  color: #2E8B57;
  font-weight: 600;
}

select {
  appearance: none;
  background: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2320B2AA'%3e%3cpath d='M7 10l5 5 5-5z'/%3e%3c/svg%3e") 
  no-repeat right 1.2rem center/16px;
  background-color: rgba(255, 255, 255, 0.9);
}

button {
  width: 100%;
  padding: 1.2rem;
  background: linear-gradient(135deg, #20B2AA, #2E8B57);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(32, 178, 170, 0.3);
}

button:hover {
  background: linear-gradient(135deg, #2E8B57, #20B2AA);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(32, 178, 170, 0.4);
}

button:active {
  transform: translateY(0);
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 1.5rem;
  justify-content: flex-start;
}

.remember-me input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: #20B2AA;
}

.remember-me label {
  position: static;
  color: #666;
  font-size: 0.95rem;
  background: none;
  padding: 0;
  transform: none;
  pointer-events: auto;
}

.toggle-form {
  text-align: center;
  margin-top: 2rem;
  color: #666;
  font-size: 0.95rem;
}

.toggle-form a {
  color: #20B2AA;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.3s ease;
}

.toggle-form a:hover {
  color: #2E8B57;
  text-decoration: underline;
}

.password-strength {
  display: flex;
  gap: 0.3rem;
  margin-top: 0.8rem;
  align-items: center;
}

.strength-bar {
  flex: 1;
  height: 6px;
  background: #eee;
  border-radius: 3px;
  transition: all 0.3s ease;
}

.strength-text {
  font-size: 0.8rem;
  margin-left: 0.8rem;
  color: #666;
  font-weight: 500;
  min-width: 30px;
}

.error-message {
  color: #e74c3c;
  font-size: 0.85rem;
  margin-top: 0.5rem;
  display: block;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .container {
    width: 90%;
    padding: 2rem 1.5rem;
    margin: 1rem;
  }
  
  h2 {
    font-size: 1.5rem;
  }
  
  input, select {
    padding: 1rem;
  }
}
</style>
