const httpMocks = require("node-mocks-http");
const partyController = require("../../src/controller/party");
const partyModel = require("../../src/model/party");
const db = require("../../src/db");

// partyModel.create = jest.fn();
let req, res, next;

// MySQL 모듈 모킹
jest.mock("../../src/db", () => ({
  query: jest.fn(),
}));

describe("파티 생성", () => {
  afterEach(() => {
    jest.clearAllMocks(); // 모든 mock 초기화
  });
  it("파티 생성은 함수여야함", () => {
    expect(typeof partyController.createParty).toBe("function");
  });

  it("파티 생성 중복", async () => {
    const bodyData = { title: "아르카나 사냥", server: "스카니아", region: "아르카나", player_id: 2 };

    db.query.mockResolvedValueOnce([[{ count: 1 }]]); // 중복 없음
    await expect(partyModel.create(bodyData)).rejects.toThrow("같은 이름의 파티방이 존재합니다.");
  });

  it("파티 생성 성공", async () => {
    const bodyData = { title: "아르카나 사냥", server: "스카니아", region: "아르카나", player_id: 2 };

    db.query.mockResolvedValueOnce([[{ count: 0 }]]); // 중복 없음
    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // 생성 성공

    const result = await partyModel.create(bodyData);

    // 결과 검증
    expect(result).toEqual({ affectedRows: 1 });
    // 쿼리 호출 순서와 매개변수 검증
    expect(db.query).toHaveBeenCalledWith("SELECT COUNT(*) AS count FROM parties WHERE title = ? ", [bodyData.title]);
    expect(db.query).toHaveBeenCalledWith("insert into parties (title, server, region, creator_id) values (?,?,?,?)", [bodyData.title, bodyData.server, bodyData.region, bodyData.player_id]);
  });

  it("파티 생성 실패 시", async () => {
    const bodyData = { title: "", server: "", region: "", player_id: 1 };
    db.query.mockResolvedValue([[]]); // Simulate empty result for invalid data

    await expect(partyModel.create(bodyData)).rejects.toThrow("입력값 오류");
  });
});

describe("파티 수정", () => {
  afterEach(() => {
    jest.clearAllMocks(); // 모든 mock 초기화
  });
  it("파티 수정은 함수여야함", () => {
    expect(typeof partyController.editParty).toBe("function");
  });

  it("파티 수정 성공", async () => {
    const bodyData = { title: "모라스 사냥", region: "모라스" };
    const id = 1;

    db.query.mockResolvedValue([{ affectedRows: 1 }]);
    const result = await partyModel.edit({ ...bodyData, id });

    expect(result).toEqual({ affectedRows: 1 });

    const keys = Object.keys(bodyData);
    const values = Object.values(bodyData);

    expect(db.query).toHaveBeenCalledWith(`update parties set ${keys.join((v) => `${v} = ?`)} where id = ?`, [...values, id]);
  });

  it("파티 수정 실패", async () => {});
});

describe('파티 조회', () => {
  afterEach(() => {
    jest.clearAllMocks(); // 모든 mock 초기화
  });

  it('파티 조회는 함수', async () => {
    const result = await partyModel.get();

    console.log('rrr123123', result)

    expect(typeof partyController.getParty).toBe('function')
  });

  it('파티 조회 성공시', async () => {
// Mock 데이터 설정
  const mockParties = [
    { id: 1, title: "파티1", server: "스카니아", region: "아르카나", creator_id: 2 },
    { id: 2, title: "파티2", server: "크로아", region: "모라스", creator_id: 3 },
  ];
  db.query.mockResolvedValueOnce([mockParties]);

  // 호출
  const result = await partyModel.get();

  // 호출 여부 검증
  expect(db.query).toHaveBeenCalledWith("select * from parties");
  expect(result).toEqual(mockParties);
  })
})
