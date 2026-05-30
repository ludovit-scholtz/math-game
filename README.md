# Math Reflex Game

A mobile-native educational game (Expo/React Native) for 2nd grade students.

## Features
- Challenge lengths: 1, 2, or 5 minutes
- Selectable operations: plus, minus, multiply, divide
- Questions constrained to values within 0..100
- Division questions always produce whole-number results
- 5 shuffled answer cards with common mistake options
- Adaptive retry queue: missed questions reappear after a few attempts
- Time-based scoring:
  - < 1 second: 3 points
  - 1..10 seconds: linear score from 3 down to 1
  - > 10 seconds: -1 point
- Sound feedback for correct/incorrect answers
- Local top-score leaderboard shown after each game

## Run
```bash
npm install
npm run android
```

Other options:
- `npm start`
- `npm run ios`
- `npm run web`
- `npm test`
