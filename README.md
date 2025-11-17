### 模块化零信任项目

---

#### 项目目录

- ztrust/
  - src/
    - controller/
      - ID verifier/
      - monitor/
      - strategy engine/
    - gateway/
      - monitor/
      - strategy executor/
    - userAgent/
      - client/
      - monitor/
      - proxy/
  - README.md

---
userAgent：用于开发用户代理和客户端

- client：客户端应用
- proxy：用户代理，转发客户端出入的流量
- monitor：监控，用于收集信息和应急处理
</br>

controller：控制器相关模块

- ID verifier：身份验证模块
- strategy engine：策略决策与管理模块
- monitor：监控与响应模块
</br>

gateway：网关相关模块

- strategy executor：策略执行点
- monitor：监控，用于收集信息和应急处理
