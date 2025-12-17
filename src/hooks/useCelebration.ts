import { useState } from 'react';
import confetti from 'canvas-confetti';

type CelebrationType = 'deal_won' | 'goal_achieved' | 'achievement';

type CelebrationData = {
  title: string;
  value?: number;
  message?: string;
  icon?: string;
};

export const useCelebration = () => {
  const [showModal, setShowModal] = useState(false);
  const [celebrationType, setCelebrationType] = useState<CelebrationType>('deal_won');
  const [celebrationData, setCelebrationData] = useState<CelebrationData>({ title: '' });

  const celebrate = (type: CelebrationType, data: CelebrationData) => {
    setCelebrationType(type);
    setCelebrationData(data);
    setShowModal(true);

    // Trigger confetti
    const duration = 3000;
    const animationEnd = Date.now() + duration;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        particleCount,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'],
      });
    }, 250);

    // Som de vitória (opcional)
    try {
      const audio = new Audio('/sounds/celebration.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch (e) {}
  };

  return {
    showModal,
    setShowModal,
    celebrationType,
    celebrationData,
    celebrate,
  };
};
