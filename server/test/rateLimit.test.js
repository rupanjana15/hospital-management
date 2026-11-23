const test = require("node:test");
const assert = require("node:assert");
const {
  loginRateLimiter,
  getRateLimitStatus,
  RATE_LIMIT_CONFIG,
} = require("../src/middlewares/rateLimit.middleware");

function makeReq(ip) {
  return { headers: { "x-forwarded-for": ip }, socket: {} };
}

function makeRes() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

// Runs the middleware; returns { req, res, passed }
function hit(ip) {
  const req = makeReq(ip);
  const res = makeRes();
  let passed = false;
  loginRateLimiter(req, res, () => {
    passed = true;
  });
  return { req, res, passed };
}

test("allows requests until the max failed attempts is reached", () => {
  const ip = "10.0.0.1";
  for (let i = 0; i < RATE_LIMIT_CONFIG.maxAttempts; i++) {
    const { req, passed } = hit(ip);
    assert.ok(passed, `attempt ${i + 1} should be allowed`);
    req.recordFailedLoginAttempt();
  }
  const blocked = hit(ip);
  assert.strictEqual(blocked.passed, false);
  assert.strictEqual(blocked.res.statusCode, 429);
  assert.ok(blocked.res.body.retryAfter > 0);
});

test("a successful login clears the failed attempts", () => {
  const ip = "10.0.0.2";
  const first = hit(ip);
  first.req.recordFailedLoginAttempt();
  assert.strictEqual(getRateLimitStatus(ip).attempts, 1);
  first.req.clearLoginAttempts();
  assert.strictEqual(getRateLimitStatus(ip), null);
});

test("uses the first address in x-forwarded-for and tracks IPs separately", () => {
  const a = hit("10.0.0.3, 192.168.1.1");
  a.req.recordFailedLoginAttempt();
  assert.strictEqual(getRateLimitStatus("10.0.0.3").remaining, RATE_LIMIT_CONFIG.maxAttempts - 1);
  assert.strictEqual(getRateLimitStatus("10.0.0.4"), null);
});
