const { scoreForSeconds, generateQuestion, generateOptions } = require('../src/gameLogic');

describe('scoreForSeconds', () => {
  it('gives 3 points for answers under one second', () => {
    expect(scoreForSeconds(0.5)).toBe(3);
  });

  it('gives linear score between one and ten seconds', () => {
    expect(scoreForSeconds(1)).toBe(3);
    expect(scoreForSeconds(5.5)).toBe(2);
    expect(scoreForSeconds(10)).toBe(1);
  });

  it('gives -1 point after ten seconds', () => {
    expect(scoreForSeconds(10.01)).toBe(-1);
  });
});

describe('generateQuestion bounds', () => {
  it('keeps operations valid and in 0..100', () => {
    const operations = ['+', '-', '*', '/'];

    for (let i = 0; i < 200; i += 1) {
      const op = operations[i % operations.length];
      const question = generateQuestion(op);
      expect(question.answer).toBeGreaterThanOrEqual(0);
      expect(question.answer).toBeLessThanOrEqual(100);

      if (op === '/') {
        expect(question.a % question.b).toBe(0);
      }
    }
  });
});

describe('generateOptions', () => {
  it('returns five answer cards including the correct one', () => {
    const options = generateOptions({ answer: 35, b: 7 });
    expect(options).toHaveLength(5);
    expect(options).toContain(35);
  });
});
