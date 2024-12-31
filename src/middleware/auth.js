const jwt = require("jsonwebtoken");

const auth = async (req, res, next) => {
  console.log(req.path, req.headers.authorization);
  try {
    const excludedPaths = ["/user/kakaoLogin"];

    const isExcludedPath = excludedPaths.includes(req.path);

    if (isExcludedPath) {
      return next();
    }

    const token = req.headers.authorization.split("Bearer ")[1];
    console.log("token", token);
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (!decoded) {
      throw new Error("인증되지 않은 사용자입니다.");
    }

    console.log("decoded", token, decoded);

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
