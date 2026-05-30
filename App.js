import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Pressable,
  FlatList,
  Switch
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import {
  OPERATIONS,
  scoreForSeconds,
  generateOptions,
  pickQuestion,
  shuffle
} from './src/gameLogic';

const DURATIONS = [60, 120, 300];
const SCORE_KEY = 'math_game_scores_v1';

export default function App() {
  const [screen, setScreen] = useState('setup');
  const [duration, setDuration] = useState(60);
  const [enabledOps, setEnabledOps] = useState(['+', '-', '*', '/']);
  const [leaderboard, setLeaderboard] = useState([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [question, setQuestion] = useState(null);
  const [options, setOptions] = useState([]);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [streak, setStreak] = useState(0);

  const retryQueueRef = useRef([]);
  const askedAtRef = useRef(Date.now());
  const correctSoundRef = useRef(null);
  const wrongSoundRef = useRef(null);

  useEffect(() => {
    AsyncStorage.getItem(SCORE_KEY).then((data) => {
      if (data) {
        setLeaderboard(JSON.parse(data));
      }
    });

    const loadSounds = async () => {
      const correct = new Audio.Sound();
      const wrong = new Audio.Sound();
      await correct.loadAsync(require('./assets/correct.wav'));
      await wrong.loadAsync(require('./assets/wrong.wav'));
      correctSoundRef.current = correct;
      wrongSoundRef.current = wrong;
    };

    loadSounds();

    return () => {
      correctSoundRef.current?.unloadAsync();
      wrongSoundRef.current?.unloadAsync();
    };
  }, []);

  useEffect(() => {
    if (screen !== 'playing') return undefined;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [screen]);

  const opKeys = useMemo(() => Object.keys(OPERATIONS), []);

  const setNextQuestion = (count) => {
    const next = pickQuestion(enabledOps, retryQueueRef.current, count);
    setQuestion(next);
    setOptions(generateOptions(next));
    askedAtRef.current = Date.now();
  };

  const startGame = () => {
    const usableOps = enabledOps.length ? enabledOps : ['+'];
    setEnabledOps(usableOps);
    retryQueueRef.current = [];
    setScore(0);
    setStreak(0);
    setAnsweredCount(0);
    setTimeLeft(duration);
    setScreen('playing');

    const first = pickQuestion(usableOps, retryQueueRef.current, 0);
    setQuestion(first);
    setOptions(generateOptions(first));
    askedAtRef.current = Date.now();
  };

  const endGame = async () => {
    setScreen('results');
    const next = shuffle([...leaderboard, { score, playedAt: Date.now(), duration }])
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    setLeaderboard(next);
    await AsyncStorage.setItem(SCORE_KEY, JSON.stringify(next));
  };

  const toggleOperation = (op) => {
    setEnabledOps((prev) => {
      if (prev.includes(op)) return prev.filter((item) => item !== op);
      return [...prev, op];
    });
  };

  const playFeedback = async (isCorrect) => {
    const target = isCorrect ? correctSoundRef.current : wrongSoundRef.current;
    if (!target) return;
    try {
      await target.replayAsync();
    } catch (e) {
      // ignore sound errors
    }
  };

  const onSelectAnswer = async (value) => {
    if (!question || screen !== 'playing') return;

    const seconds = (Date.now() - askedAtRef.current) / 1000;
    const correct = value === question.answer;

    if (correct) {
      setScore((prev) => prev + scoreForSeconds(seconds));
      setStreak((prev) => prev + 1);
    } else {
      setScore((prev) => prev - 1);
      setStreak(0);
      retryQueueRef.current.push({
        retryAt: answeredCount + 1 + Math.floor(Math.random() * 3),
        question
      });
    }

    await playFeedback(correct);

    const nextCount = answeredCount + 1;
    setAnsweredCount(nextCount);
    setNextQuestion(nextCount);
  };

  if (screen === 'setup') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Math Reflex Game</Text>
        <Text style={styles.subtitle}>Pick challenge time</Text>
        <View style={styles.row}>
          {DURATIONS.map((value) => (
            <Pressable
              key={value}
              style={[styles.chip, duration === value && styles.chipActive]}
              onPress={() => setDuration(value)}
            >
              <Text style={styles.chipText}>{value / 60} min</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.subtitle}>Choose operations</Text>
        {opKeys.map((op) => (
          <View style={styles.switchRow} key={op}>
            <Text style={styles.operationLabel}>{OPERATIONS[op].label}</Text>
            <Switch value={enabledOps.includes(op)} onValueChange={() => toggleOperation(op)} />
          </View>
        ))}

        <Pressable style={styles.startButton} onPress={startGame}>
          <Text style={styles.startButtonText}>Start Learning Challenge</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (screen === 'results') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Great effort!</Text>
        <Text style={styles.score}>Your score: {score.toFixed(2)}</Text>
        <Text style={styles.subtitle}>Top Scores</Text>
        <FlatList
          data={leaderboard}
          keyExtractor={(item) => `${item.playedAt}-${item.score}`}
          renderItem={({ item, index }) => (
            <Text style={styles.leaderboardItem}>
              {index + 1}. {item.score.toFixed(2)} points ({item.duration / 60} min)
            </Text>
          )}
        />
        <Pressable style={styles.startButton} onPress={() => setScreen('setup')}>
          <Text style={styles.startButtonText}>Play Again</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.gameHeader}>
        <Text style={styles.timer}>⏱ {timeLeft}s</Text>
        <Text style={styles.score}>⭐ {score.toFixed(2)}</Text>
        <Text style={styles.score}>🔥 {streak}</Text>
      </View>
      <Text style={styles.problem}>{question?.expression}</Text>
      <Text style={styles.subtitle}>Pick the best answer card</Text>
      <View style={styles.cards}>
        {options.map((option) => (
          <Pressable key={`${question?.expression}-${option}`} style={styles.card} onPress={() => onSelectAnswer(option)}>
            <Text style={styles.cardText}>{option}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.tip}>Fast answers earn more points. Keep practicing to beat your best!</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fbff',
    padding: 20,
    gap: 14
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2541b2'
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600'
  },
  row: {
    flexDirection: 'row',
    gap: 10
  },
  chip: {
    backgroundColor: '#dde7ff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12
  },
  chipActive: {
    backgroundColor: '#6d8bff'
  },
  chipText: {
    color: '#0f1a4d',
    fontWeight: '700'
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  operationLabel: {
    fontSize: 17
  },
  startButton: {
    marginTop: 8,
    backgroundColor: '#ff9f1c',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center'
  },
  startButtonText: {
    color: '#202020',
    fontSize: 18,
    fontWeight: '700'
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  timer: {
    fontSize: 20,
    fontWeight: '700'
  },
  score: {
    fontSize: 20,
    fontWeight: '700'
  },
  problem: {
    marginTop: 30,
    fontSize: 50,
    textAlign: 'center',
    fontWeight: '700',
    color: '#123'
  },
  cards: {
    marginTop: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10
  },
  card: {
    width: '48%',
    minHeight: 90,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#d6f5ff',
    borderWidth: 2,
    borderColor: '#6bc5ff'
  },
  cardText: {
    fontSize: 34,
    fontWeight: '700',
    color: '#004466'
  },
  tip: {
    marginTop: 'auto',
    fontSize: 16,
    textAlign: 'center',
    color: '#264653'
  },
  leaderboardItem: {
    fontSize: 18,
    paddingVertical: 4
  }
});
