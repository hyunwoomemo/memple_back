const userController = require("../../src/controller/user");
const httpMocks = require("node-mocks-http");

// MySQL 모듈 모킹
jest.mock("../../src/db", () => ({
  query: jest.fn(),
}));

describe("유저 로그인", () => {
  it("유저 로그인 타입은 함수", () => {
    expect(typeof userController.login).toBe("function");
  });

  it("유저 로그인 req.body 체크", async () => {
    // 1. req, res 객체 생성
    const req = httpMocks.createRequest({
      method: "POST",
      url: "/login/kakao",
      params: { social: "kakao" }, // 명시적으로 params 추가
      body: { token: "123" }, // 필수 값이 없는 요청
    });
    const res = httpMocks.createResponse();

    // 로그인 함수 호출
    await userController.login(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._getJSONData()).toEqual({ message: "필수값 누락" });
  });
});
