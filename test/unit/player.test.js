const httpMocks = require("node-mocks-http");
const newPlayer = require("../data/new-player.json");
const playerController = require("../../src/controller/player");
const playerModel = require("../../src/model/player");
let req, res, next;

playerModel.create = jest.fn();

beforeEach(() => {
  req = httpMocks.createRequest();
  res = httpMocks.createResponse();
  next = null;
});

describe("player controller create", () => {
  beforeEach(() => {
    req.body = { name: newPlayer.name, server: newPlayer.server };
  });

  it("should have a createPlayer function", () => {
    expect(typeof playerController.createPlayer).toBe("function");
  });

  it("should call playerModel.create", () => {
    playerController.createPlayer(req, res, next);
    expect(playerModel.create).toHaveBeenCalledWith({ name: newPlayer.name, server: newPlayer.server });
  });

  it("should return 201 response code on success", async () => {
    playerModel.create.mockResolvedValue({ affectedRows: 1 });
    await playerController.createPlayer(req, res, next);
    expect(res.statusCode).toBe(201);
    expect(res._isEndCalled()).toBeTruthy();
    expect(res._getJSONData()).toEqual({ success: true, message: "플레이어 생성 성공" });
  });

  it("should return 500 response code on failure", async () => {
    playerModel.create.mockResolvedValue({ affectedRows: 0 });
    await playerController.createPlayer(req, res, next);
    expect(res.statusCode).toBe(500);
    expect(res._isEndCalled()).toBeTruthy();
    expect(res._getJSONData()).toEqual({ success: false, message: "플레이어 생성 실패" });
  });

  it("should return 500 response code on exception", async () => {
    playerModel.create.mockRejectedValue(new Error("Database error"));
    await playerController.createPlayer(req, res, next);
    expect(res.statusCode).toBe(500);
    expect(res._isEndCalled()).toBeTruthy();
    expect(res._getJSONData()).toEqual({ success: false, message: "Database error" });
  });
});
