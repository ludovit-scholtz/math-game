const OPERATIONS = {
  '+': { label: 'Plus' },
  '-': { label: 'Minus' },
  '*': { label: 'Multiply' },
  '/': { label: 'Divide' }
};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function scoreForSeconds(seconds) {
  if (seconds < 1) return 3;
  if (seconds > 10) return -1;
  return Number((3 - ((seconds - 1) * 2) / 9).toFixed(2));
}

function generateQuestion(operation) {
  switch (operation) {
    case '+': {
      const a = randomInt(0, 100);
      const b = randomInt(0, 100 - a);
      return { operation, a, b, answer: a + b, expression: `${a} + ${b}` };
    }
    case '-': {
      const a = randomInt(0, 100);
      const b = randomInt(0, a);
      return { operation, a, b, answer: a - b, expression: `${a} - ${b}` };
    }
    case '*': {
      const a = randomInt(0, 10);
      const b = randomInt(0, 10);
      return { operation, a, b, answer: a * b, expression: `${a} × ${b}` };
    }
    case '/': {
      const divisor = randomInt(1, 10);
      const quotient = randomInt(0, Math.floor(100 / divisor));
      const dividend = divisor * quotient;
      return {
        operation,
        a: dividend,
        b: divisor,
        answer: quotient,
        expression: `${dividend} ÷ ${divisor}`
      };
    }
    default:
      return generateQuestion('+');
  }
}

function generateOptions(question) {
  const correct = question.answer;
  const wrong = new Set();
  wrong.add(Math.max(0, correct + 1));
  wrong.add(Math.max(0, correct - 1));
  wrong.add(Math.max(0, correct + question.b));
  wrong.add(Math.max(0, correct - question.b));

  while (wrong.size < 4) {
    wrong.add(Math.max(0, correct + randomInt(-10, 10)));
  }

  const options = shuffle([correct, ...Array.from(wrong).filter((v) => v !== correct).slice(0, 4)]);
  return options;
}

function pickQuestion(enabledOps, retryQueue, answeredCount) {
  const due = retryQueue.find((item) => item.retryAt <= answeredCount);
  if (due) {
    retryQueue.splice(retryQueue.indexOf(due), 1);
    return due.question;
  }
  const operation = enabledOps[randomInt(0, enabledOps.length - 1)];
  return generateQuestion(operation);
}

module.exports = {
  OPERATIONS,
  scoreForSeconds,
  generateQuestion,
  generateOptions,
  pickQuestion,
  shuffle
};
