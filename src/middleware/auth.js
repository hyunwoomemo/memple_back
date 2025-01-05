const jwt = require("jsonwebtoken");

const auth = async (req, res, next) => {
  try {
    const excludedPaths = ["/user/kakaoLogin", "/user/refreshToken"];
    const excludedPrefixes = ["/assets"];

    const isExcludedPath = excludedPaths.includes(req.path);
    const isExcludedPrefix = excludedPrefixes.some((prefix) => req.path.startsWith(prefix));

    // 현재 요청 경로가 제외할 경로에 포함되는지 확인
    if (isExcludedPath || isExcludedPrefix) {
      return next(); // 포함되면 authJWT를 적용하지 않고 다음 미들웨어로 이동
    }

    const token = req.headers.authorization.split("Bearer ")[1];
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (!decoded) {
      throw new Error("인증되지 않은 사용자입니다.");
    }

    req.user = decoded;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ success: false, message: "토큰이 만료되었습니다." });
    } else {
      res.status(401).json({ success: false, message: "인증되지 않은 사용자입니다." });
    }
  }
};

module.exports = auth;
