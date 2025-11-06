<template>
  <div class="home-view">
    <div class="dynamic-background">
      <div class="background-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
        <div class="shape shape-4"></div>
        <div class="shape shape-5"></div>
      </div>
    </div>
    
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
              <option value="reader">普通用户</option>
              <option value="admin">管理员</option>
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
              <option value="reader">普通用户</option>
              <option value="admin">管理员</option>
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
export default {
  name: 'HomeView',
  data() {
    return {
      activeForm: 'login',
      rememberMe: false,
      loginForm: {
        account: '',
        password: '',
        userType: 'reader'
      },
      registerForm: {
        account: '',
        name: '',
        email: '',
        userType: 'reader',
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
            role: this.loginForm.userType
          })
        });
        
        const data = await res.json();
        
        if (res.status === 200) {
          alert('登录成功！');
          if (data.role === 'admin') {
            window.location.href = './adminpage.html';
          } else if (data.role === 'reader') {
            window.location.href = './search.html';
          }
        } else if (res.status === 400) {
          if (data.code === 2) {
            alert(data.message || '用户不存在');
          } else if (data.code === 3) {
            alert(data.message || '密码错误');
          } else {
            alert(data.message || '登录失败');
          }
        }
      } catch (err) {
        console.error("捕获到错误：", err);
        console.log("错误类型：", err.name);
        console.log("错误消息：", err.message);
        if (err.stack) {
          console.log("错误堆栈：", err.stack);
        }
        alert('网络错误，请稍后再试。');
      }
    },
    
    async handleRegister() {
      // 确认密码一致性
      if (this.registerForm.password !== this.registerForm.confirmPassword) {
        this.passwordError = '请确认密码一致';
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
            userType: this.registerForm.userType,
            password: this.registerForm.password
          })
        });
        
        const data = await res.json();
        console.log(res.status);
        
        if (res.status === 200 && data.code === 2) {
          alert(data.message || '注册成功。');
          // 切换到登录表单并填充账号
          this.activeForm = 'login';
          this.loginForm.account = this.registerForm.account;
          this.loginForm.userType = this.registerForm.userType;
          this.loginForm.password = '';
          
          // 重置注册表单
          this.registerForm = {
            account: '',
            name: '',
            email: '',
            userType: 'reader',
            password: '',
            confirmPassword: ''
          };
          
          console.log('转换成功');
        } else {
          if (res.status === 400 && data.code === 1) {
            alert('用户已存在，请重新注册。');
          } else {
            alert(data.message || '注册失败');
          }
        }
      } catch (err) {
        console.log("错误类型：", err.name);
        console.log("错误消息：", err.message);
        if (err.stack) {
          console.log("错误堆栈：", err.stack);
        }
        alert('网络错误，请稍后再试');
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
}

/* 动态背景样式 */
.dynamic-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  background: linear-gradient(-45deg, #8B4513, #D2691E, #CD853F, #F4A460, #DEB887);
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
  overflow: hidden;
}

.background-shapes {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.shape {
  position: absolute;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  animation: float 20s infinite linear;
}

.shape-1 {
  width: 80px;
  height: 80px;
  top: 10%;
  left: 10%;
  animation-delay: 0s;
  animation-duration: 25s;
}

.shape-2 {
  width: 120px;
  height: 120px;
  top: 60%;
  left: 80%;
  animation-delay: -5s;
  animation-duration: 30s;
}

.shape-3 {
  width: 60px;
  height: 60px;
  top: 80%;
  left: 20%;
  animation-delay: -10s;
  animation-duration: 20s;
}

.shape-4 {
  width: 100px;
  height: 100px;
  top: 30%;
  left: 70%;
  animation-delay: -15s;
  animation-duration: 35s;
}

.shape-5 {
  width: 70px;
  height: 70px;
  top: 70%;
  left: 60%;
  animation-delay: -20s;
  animation-duration: 28s;
}

@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

@keyframes float {
  0% {
    transform: translate(0, 0) rotate(0deg);
  }
  25% {
    transform: translate(100px, 50px) rotate(90deg);
  }
  50% {
    transform: translate(200px, -50px) rotate(180deg);
  }
  75% {
    transform: translate(100px, -100px) rotate(270deg);
  }
  100% {
    transform: translate(0, 0) rotate(360deg);
  }
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
  background: rgba(253, 245, 230, 0.95);
  padding: 2.5rem;
  border-radius: 20px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
  width: 450px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
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
  color: #8B4513;
  margin-bottom: 2rem;
  text-align: center;
  font-size: 1.8rem;
  font-weight: 600;
}

h2 i {
  margin-right: 10px;
  color: #D2691E;
}

.form-group {
  position: relative;
  margin-bottom: 1.8rem;
}

input, select {
  width: 100%;
  padding: 1.2rem;
  border: 2px solid #DEB887;
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.3s ease;
  outline: none;
}

input:focus, select:focus,
input:not(:placeholder-shown) {
  border-color: #8B4513;
  box-shadow: 0 0 0 3px rgba(139, 69, 19, 0.1);
  background: white;
}

.form-group label {
  position: absolute;
  left: 1.2rem;
  top: 50%;
  transform: translateY(-50%);
  color: #A0522D;
  pointer-events: none;
  transition: all 0.3s ease;
  background: linear-gradient(transparent 50%, rgba(253, 245, 230, 0.95) 50%);
  padding: 0 0.5rem;
  font-weight: 500;
}

input:focus ~ label,
input:not(:placeholder-shown) ~ label {
  top: -0.8rem;
  font-size: 0.85rem;
  color: #8B4513;
  font-weight: 600;
}

select {
  appearance: none;
  background: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%238B4513'%3e%3cpath d='M7 10l5 5 5-5z'/%3e%3c/svg%3e") 
  no-repeat right 1.2rem center/16px;
  background-color: rgba(255, 255, 255, 0.9);
}

button {
  width: 100%;
  padding: 1.2rem;
  background: linear-gradient(135deg, #8B4513, #A0522D);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(139, 69, 19, 0.3);
}

button:hover {
  background: linear-gradient(135deg, #A0522D, #8B4513);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(139, 69, 19, 0.4);
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
  accent-color: #8B4513;
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
  color: #8B4513;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.3s ease;
}

.toggle-form a:hover {
  color: #A0522D;
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
