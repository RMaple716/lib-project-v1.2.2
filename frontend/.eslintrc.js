module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: [
    'plugin:vue/essential', // Vue 2 项目用这个
    'eslint:recommended'
  ],
  parserOptions: {
    parser: '@babel/eslint-parser', // 指定 Babel 解析器
    requireConfigFile: false // 关闭强制检查 Babel 配置文件
  },
  rules: {
    // 这里可以添加自定义规则
  }
}
