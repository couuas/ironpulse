/**
 * IronPulse v0.0.2 后端 API 与增量同步端到端自动化测试脚本
 */
const http = require('http');

const PORT = 3001;
const BASE_URL = `http://127.0.0.1:${PORT}`;

function request(path, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    const req = http.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 开始执行 IronPulse v0.0.2 核心后端与增量同步测试...\n');

  // 1. 健康检查
  console.log('1️⃣ 测试健康检查接口 GET /api/health ...');
  const healthRes = await request('/api/health');
  if (healthRes.status !== 200 || healthRes.body.status !== 'ok') {
    throw new Error(`健康检查失败: ${JSON.stringify(healthRes)}`);
  }
  console.log('   ✓ 健康检查通过，服务器在线\n');

  // 2. 账号注册
  const testUsername = `athlete_${Date.now()}`;
  const testPassword = 'Password123!';
  console.log(`2️⃣ 测试账号注册 POST /api/auth/register (用户: ${testUsername}) ...`);
  const registerRes = await request('/api/auth/register', { method: 'POST' }, {
    username: testUsername,
    password: testPassword
  });
  if (registerRes.status !== 201 || !registerRes.body.token) {
    throw new Error(`注册失败: ${JSON.stringify(registerRes)}`);
  }
  const token = registerRes.body.token;
  console.log('   ✓ 注册成功，成功签发 JWT Token\n');

  // 3. 账号登录
  console.log('3️⃣ 测试账号登录 POST /api/auth/login ...');
  const loginRes = await request('/api/auth/login', { method: 'POST' }, {
    username: testUsername,
    password: testPassword
  });
  if (loginRes.status !== 200 || !loginRes.body.token) {
    throw new Error(`登录失败: ${JSON.stringify(loginRes)}`);
  }
  console.log('   ✓ 登录验证通过\n');

  // 4. 用户信息查询
  console.log('4️⃣ 测试 Token 鉴权 GET /api/auth/me ...');
  const meRes = await request('/api/auth/me', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (meRes.status !== 200 || meRes.body.user.username !== testUsername) {
    throw new Error(`Auth/me 验证失败: ${JSON.stringify(meRes)}`);
  }
  console.log('   ✓ Token 解析鉴权正确\n');

  // 5. 增量推送 (Push)
  console.log('5️⃣ 测试增量数据上报 POST /api/sync/push ...');
  const now = Date.now();
  const pushPayload = {
    exercises: [
      {
        id: 'test-ex-bench',
        name: '杠铃卧推',
        targetMuscle: 'chest',
        equipment: 'barbell',
        defaultRestSeconds: 120,
        isCustom: false,
        createdAt: now,
        updatedAt: now,
        isDeleted: false
      }
    ],
    workouts: [
      {
        id: 'test-wk-1',
        name: '胸部力量轰炸日',
        startTime: now - 3600000,
        endTime: now,
        durationSeconds: 3600,
        totalVolumeKg: 4200,
        setsCount: 16,
        status: 'completed',
        createdAt: now,
        updatedAt: now,
        isDeleted: false
      }
    ],
    workoutSets: [
      {
        id: 'test-set-1',
        workoutId: 'test-wk-1',
        exerciseId: 'test-ex-bench',
        setNumber: 1,
        setType: 'normal',
        weightKg: 100,
        reps: 8,
        isCompleted: true,
        isPR: true,
        estimated1RM: 124,
        createdAt: now,
        updatedAt: now,
        isDeleted: false
      }
    ],
    bodyMeasurements: [
      {
        id: 'test-bm-1',
        date: '2026-09-08',
        weightKg: 78.5,
        chestCm: 105,
        waistCm: 80,
        createdAt: now,
        updatedAt: now,
        isDeleted: false
      }
    ]
  };

  const pushRes = await request('/api/sync/push', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  }, pushPayload);

  if (pushRes.status !== 200 || !pushRes.body.success) {
    throw new Error(`Push 失败: ${JSON.stringify(pushRes)}`);
  }
  console.log('   ✓ Push 增量上报持久化成功，处理统计:', pushRes.body.processedCounts, '\n');

  // 6. 增量拉取 (Pull)
  console.log('6️⃣ 测试增量数据拉取 GET /api/sync/pull?lastSync=0 ...');
  const pullRes = await request('/api/sync/pull?lastSync=0', {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (pullRes.status !== 200 || !pullRes.body.data) {
    throw new Error(`Pull 失败: ${JSON.stringify(pullRes)}`);
  }
  const pulledData = pullRes.body.data;
  if (pulledData.exercises.length !== 1 || pulledData.workouts.length !== 1 || pulledData.workoutSets.length !== 1) {
    throw new Error(`拉取数据条数与预期不符: ${JSON.stringify(pulledData)}`);
  }
  console.log('   ✓ Pull 全量增量拉取成功:');
  console.log(`     - Exercises: ${pulledData.exercises.length} 项 (名称: ${pulledData.exercises[0].name})`);
  console.log(`     - Workouts: ${pulledData.workouts.length} 项 (名称: ${pulledData.workouts[0].name})`);
  console.log(`     - WorkoutSets: ${pulledData.workoutSets.length} 组 (重量: ${pulledData.workoutSets[0].weightKg}kg x ${pulledData.workoutSets[0].reps})`);
  console.log(`     - BodyMeasurements: ${pulledData.bodyMeasurements.length} 项 (体重: ${pulledData.bodyMeasurements[0].weightKg}kg)\n`);

  // 7. 时间戳过滤验证
  console.log('7️⃣ 测试时间戳过滤 GET /api/sync/pull?lastSync=${futureTime} ...');
  const futurePull = await request(`/api/sync/pull?lastSync=${now + 100000}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (futurePull.body.data.exercises.length !== 0 || futurePull.body.data.workouts.length !== 0) {
    throw new Error(`时间戳增量过滤未生效: ${JSON.stringify(futurePull.body.data)}`);
  }
  console.log('   ✓ 时间戳增量过滤精确生效，返回 0 条增量变更\n');

  // 8. 测试极客免密 API Key 直连与鉴权
  console.log('8️⃣ 测试极客免密 API Key POST /api/auth/api-key ...');
  const apiKeyRes = await request('/api/auth/api-key', { method: 'POST' }, {
    apiKey: 'ironpulse_geek_secret_key_2026'
  });
  if (apiKeyRes.status !== 200 || !apiKeyRes.body.token) {
    throw new Error(`API Key 验证失败: ${JSON.stringify(apiKeyRes)}`);
  }
  console.log('   ✓ API Key 校验通过，成功直连主账号:', apiKeyRes.body.user.username);

  // 使用 API Key 直接拉取数据验证免密鉴权
  const apiKeyPull = await request('/api/sync/pull?lastSync=0', {
    headers: { 'Authorization': `Bearer ironpulse_geek_secret_key_2026` }
  });
  if (apiKeyPull.status !== 200 || !apiKeyPull.body.data) {
    throw new Error(`API Key 直接访问 Sync 失败: ${JSON.stringify(apiKeyPull)}`);
  }
  console.log('   ✓ API Key 极速鉴权拉取成功，返回实体包就绪\n');

  console.log('🎉 所有 8 项后端架构与增量同步测试全部顺利通过！');
}

runTests().catch(err => {
  console.error('❌ 测试执行失败:', err);
  process.exit(1);
});
