<template>
  <div class="welcome">
    <div class="welcome-content">
      <h1>欢迎使用青投供应链物流运输调度系统 V6</h1>
      <p>QingTou Supply Chain Logistics Transportation Scheduling System V6</p>
      <div class="info">
        <p>前端服务已成功启动</p>
        <p>Frontend service started successfully</p>
      </div>
      <div class="status">
        <h2>项目状态 Project Status</h2>
        <ul>
          <li>✅ 前端服务运行正常</li>
          <li>✅ 后端服务运行正常</li>
          <li>⏳ 业务功能开发中...</li>
        </ul>
      </div>
      <div class="links">
        <h2>快速链接 Quick Links</h2>
        <ul>
          <li><a href="http://localhost:9528/docs" target="_blank">API 文档</a></li>
          <li><a href="https://github.com" target="_blank">项目仓库</a></li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.welcome {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.welcome-content {
  text-align: center;
  max-width: 800px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  backdrop-filter: blur(10px);
}

h1 {
  font-size: 2.5em;
  margin-bottom: 10px;
}

.info {
  margin: 20px 0;
  font-size: 1.2em;
}

.status, .links {
  margin: 30px 0;
  text-align: left;
  background: rgba(255, 255, 255, 0.1);
  padding: 20px;
  border-radius: 10px;
}

h2 {
  font-size: 1.5em;
  margin-bottom: 15px;
}

ul {
  list-style: none;
  padding: 0;
}

li {
  margin: 10px 0;
  font-size: 1.1em;
}

a {
  color: #ffd700;
  text-decoration: none;
  font-weight: bold;
}

a:hover {
  text-decoration: underline;
}
</style>
