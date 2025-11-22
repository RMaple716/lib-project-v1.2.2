const { spawn, exec } = require('child_process');
const color = require('colors-cli/safe');

// 配置
const config = {
  backend: {
    command: 'npm',
    args: ['run', 'dev'],
    cwd: './backend',
    url: 'http://localhost:3000',
    name: '后端服务'
  },
  frontend: {
    command: 'npm',
    args: ['run', 'serve'],
    cwd: './frontend',
    name: '前端服务'
  }
};

class DevServer {
  constructor() {
    this.backendProcess = null;
    this.frontendProcess = null;
  }

  log(service, message) {
    console.log(color.blue(`[${service}] ${message}`));
  }

  error(service, message) {
    console.log(color.red(`[${service}] ${message}`));
  }

  success(service, message) {
    console.log(color.green(`[${service}] ${message}`));
  }

  warning(service, message) {
    console.log(color.yellow(`[${service}] ${message}`));
  }

  // 检查后端是否就绪
  checkBackendReady() {
    return new Promise((resolve) => {
      const check = async () => {
        try {
          const response = await fetch(config.backend.url);
          if (response.ok) {
            this.success('检查', '后端服务已就绪');
            resolve(true);
            return;
          }
        } catch (error) {
          // 服务还未启动，继续等待
        }
        setTimeout(check, 1000);
      };
      check();
    });
  }

  // 启动后端服务
  startBackend() {
    return new Promise((resolve) => {
      this.log('后端', '启动中...');
      
      this.backendProcess = spawn(config.backend.command, config.backend.args, {
        cwd: config.backend.cwd,
        stdio: 'pipe',
        shell: true
      });

      this.backendProcess.stdout.on('data', (data) => {
        const output = data.toString();
        // 使用更柔和的颜色显示后端日志
        process.stdout.write(color.cyan(`[后端] ${output}`));
        
        if (output.includes('服务器启动成功') || output.includes('本地访问: http://localhost:3000')) {
          this.success('后端', '启动成功，等待服务就绪...');
          setTimeout(() => {
            this.checkBackendReady().then(resolve);
          }, 1000);
        }
      });

      this.backendProcess.stderr.on('data', (data) => {
        process.stderr.write(color.yellow(`[后端错误] ${data.toString()}`));
      });

      this.backendProcess.on('close', (code) => {
        this.error('后端', `进程退出，代码: ${code}`);
        this.cleanup();
      });
    });
  }

  // 启动前端服务
  startFrontend() {
    this.log('前端', '启动中...');
    
    this.frontendProcess = spawn(config.frontend.command, config.frontend.args, {
      cwd: config.frontend.cwd,
      stdio: 'inherit',
      shell: true
    });

    this.frontendProcess.on('close', (code) => {
      this.error('前端', `进程退出，代码: ${code}`);
      this.cleanup();
    });
  }

  // 清理资源
  cleanup() {
    if (this.backendProcess) {
      this.backendProcess.kill();
    }
    if (this.frontendProcess) {
      this.frontendProcess.kill();
    }
    process.exit(0);
  }

  // 启动开发服务器
  async start() {
    try {
      // 捕获退出信号
      process.on('SIGINT', () => this.cleanup());
      process.on('SIGTERM', () => this.cleanup());

      this.log('系统', '开始启动开发环境...');
      
      // 先启动后端
      await this.startBackend();
      
      // 后端就绪后启动前端
      this.startFrontend();

    } catch (error) {
      this.error('系统', `启动失败: ${error.message}`);
      this.cleanup();
    }
  }
}

// 启动服务
const server = new DevServer();
server.start();
