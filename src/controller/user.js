const userModel = require("../model/user");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const axios = require("axios");
const db = require("../db");

exports.createUser = (req, res) => {
  const createdUser = userModel.create(req.body);
  res.status(201).json(createdUser);
};

exports.login = async (req, res) => {
  try {
    const { social } = req.params;

    console.log("socialsocial", req.body);

    if (!social) {
      throw new Error("필수값 누락");
    }

    if (social === "kakao") {
      const { accessToken, refreshToken } = req.body;

      if (!accessToken || !refreshToken) {
        throw new Error("필수값 누락");
      }
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.kakaoLogin = async (req, res) => {
  console.log(req.body);

  const { accessToken, refreshToken } = req.body;

  try {
    const kakaoResponse = await axios.get("https://kapi.kakao.com/v2/user/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const kakaoUser = kakaoResponse.data;

    console.log("🔥 kakao user", kakaoUser);

    const { id, properties, kakao_account } = kakaoUser;

    const [results] = await db.query("SELECT * FROM users WHERE user_id = ? and type = 2", [id]);

    if (results.length > 0) {
      const user = results[0];

      console.log("useruser", user);

      const newAccessToken = jwt.sign({ user_id: user.id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" });
      const newRefreshToken = jwt.sign({ user_id: user.id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

      res.json({
        CODE: "KL000",
        message: "Login successful",
        TOKEN: { accessToken: newAccessToken, refreshToken: newRefreshToken },
        DATA: { info: { user_id: user.id, created_at: user.created_at } },
      });

      console.log("success!!!");
    } else {
      const username = properties?.nickname;

      const [insertResult] = await db.query("INSERT INTO users (user_id, nickname, created_at, type) VALUES (?, ?, ?,  ?)", [id, username, new Date(), 2]);

      console.log("rrr", insertResult);

      const userId = insertResult.insertId;

      const newAccessToken = jwt.sign({ user_id: userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1m" });
      const newRefreshToken = jwt.sign({ user_id: userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

      console.log("🔥🔥🔥🔥🔥🔥🔥🔥", userId, newAccessToken, newRefreshToken);

      res.json({
        CODE: "KRL000",
        message: "Signup and login successful",
        TOKEN: { accessToken: newAccessToken, refreshToken: newRefreshToken },
        DATA: { info: { user_id: userId, created_at: new Date() } },
      });

      console.log("success!!!");
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ CODE: "ERROR", message: "Internal server error", error: err.message });
  }
};

exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(400).json({ CODE: "RT000", message: "Refresh token is required" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    if (!decoded) {
      res.status(401).json({ CODE: "RT001", message: "Invalid refresh token" });
    }

    const newAccessToken = jwt.sign({ user_id: decoded.user_id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" });
    const newRefreshToken = jwt.sign({ user_id: decoded.user_id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

    res.json({
      CODE: "RT002",
      message: "Token refreshed",
      TOKEN: { accessToken: newAccessToken, refreshToken: newRefreshToken },
    });
  } catch (err) {
    res.status(401).json({ CODE: "RT003", message: "Invalid refresh token" });
  }
};

exports.getInfo = async (req, res) => {
  try {
    const { user } = req;
    const user_id = user.user_id;

    console.log("asdasd", user_id);

    if (!user_id) {
      throw new Error("사용자 정보가 없습니다.");
    }

    // const [results] = await db.query("SELECT * FROM users WHERE id = ?", [user_id]);
    const result = await userModel.getUser(user_id);

    res.status(200).json({ success: true, user: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err });
  }
};
