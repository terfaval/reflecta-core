import React, { useEffect, useState } from 'react';
import SurveySlide from '@/components/SurveySlide';
import { AnimatePresence } from 'framer-motion';
import SurveySuccess from '@/components/SurveySuccess';
import SpiralLoader from '@/components/SpiralLoader';
import UserErrorDisplay from '@/components/UserErrorDisplay';
import BackToLogsButton from '@/components/BackToLogsButton';
import { useUserContext } from '@/contexts/UserContext';
import { useRouter } from 'next/router';
import { useProfileContext } from '@/contexts/ProfileContext';
import { useSurveyState } from '@/hooks/useSurveyState';
import { apiFetch } from '@/lib/api';
import { redirectToChat } from '@/lib/navigation';
import { useToast } from '@/hooks/useToast';
import { useErrorToast } from '@/hooks/useErrorToast';
import styles from './ProfileBuilder.module.css';

const QUESTIONS = [
  {
    q: 'Milyen terület az, amelyben szeretnél most jobban elmélyülni vagy fejlődni?',
    i: 'Írd le azt a belső vagy külső témát, ami most különösen fontos számodra.'
  },
  {
    q: 'Mi az a hosszabb távú személyes cél vagy vágy, amelyhez szükséged lenne egy belső társra vagy kísérő hangra?',
    i: 'Engedd meg magadnak, hogy leírd, merre tartasz belül.'
  },
  {
    q: 'Milyen témák vagy gondolatkörök állnak közel ahhoz, amit rendszeresen szeretnél megosztani ezzel a belső vezetővel?',
    i: 'Írd le, mi az, amit gyakran forgatsz magadban.'
  },
  {
    q: 'Milyen módon tud igazán jól kapcsolódni hozzád ez a belső társ?',
    i: 'Fogalmazd meg, milyen hangvétel, ritmus vagy stílus támogatna leginkább.'
  },
  {
    q: 'Milyen élmények, szövegek vagy hatások tükrözik leginkább azt a belső hangot, amit most keresel?',
    i: 'Írj le olyan pillanatokat vagy találkozásokat, amelyek mélyen hatottak rád.'
  }
];

const COLORS = ['#4C6EF5', '#E59866', '#5DAE8B', '#A26EBA', '#CD5C5C'];

export default function ProfileBuilder() {
  const { userId, userInitialized, userError, userRole } = useUserContext();
  const { setProfile } = useProfileContext();
  const toast = useToast();
  const errorToast = useErrorToast();
  const {
    currentQuestion,
    answers,
    progress,
    nextQuestion,
    prevQuestion,
    setAnswer,
    isFirstQuestion,
    isLastQuestion,
    step,
    direction,
  } = useSurveyState(QUESTIONS);
  const [profile, setProfileName] = useState('Személyes profil');
  const [finished, setFinished] = useState(false);
  const [startLoading, setStartLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();
  const [accessError, setAccessError] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady) return;
    if (userRole === 'guest') {
      router.replace('/guest-chat');
    }
  }, [router, userRole]);
  
  // user initialization handled globally in UserProvider

  useEffect(() => {
    if (!userId || userRole === 'guest') return;
    apiFetch<{ role?: string; personalProfiles?: string[] }>('/api/profile-list', {
      method: 'POST',
      body: JSON.stringify({ userId })
    })
      .then(data => {
        if (data.role !== 'premium' && data.role !== 'admin') {
          setAccessError('Ez csak prémium vagy admin felhasználók számára elérhető.');
          return;
        }
        const hasPersonal = (data.personalProfiles || []).length > 0;
        if (data.role === 'premium' && hasPersonal) {
          router.push('/profile-limit');
        }
      })
      .catch(err => {
        console.error(err);
        errorToast({ message: 'Hiba történt a profil betöltésekor.', type: 'network' });
      });
  }, [userId, userRole, router]);

  const handleChange = (value: string) => {
    setAnswer(value);
  };

  const handleNext = () => {
    if (!isLastQuestion) {
      nextQuestion();
    } else {
      submit();
    }
  };

  const submit = async () => {
    if (!userId || userRole === 'guest') return;
    try {
      const data = await apiFetch<{ name: string }>(
        '/api/profile/from-survey',
        {
          method: 'POST',
          body: JSON.stringify({ user_id: userId, name: profile, answers }),
        }
      );
      setProfileName(data.name || profile);
      setFinished(true);
      setErrorMsg(null);
    } catch (err) {
      console.error(err);
      setErrorMsg('Hiba történt a profil mentésekor. Kérlek, próbáld újra.');
      errorToast({ message: 'Hiba történt a profil mentésekor. Kérlek, próbáld újra.', type: 'network' });
    }
  };

  if (userError) {
    return (
      <>
        <BackToLogsButton />
        <UserErrorDisplay
          message={userError}
          onRetry={() => window.location.reload()}
        />
      </>
    );
  }

  if (!userInitialized) {
    return (
      <SpiralLoader userColor="#7A4DFF" aiColor="#FFB347" />
    );
  }

  if (accessError) {
    return (
      <>
        <BackToLogsButton />
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>{accessError}</p>
        </div>
      </>
    );
  }

  if (finished) {
    const handleStart = async () => {
      if (!userId || startLoading || userRole === 'guest') return;
      setStartLoading(true);
      setErrorMsg(null);
      try {
        const data = await apiFetch<{
          status: string; conversation_id: string; session_id: string; error?: string 
}>(
          '/api/conversation/new',
          {
            method: 'POST',
            body: JSON.stringify({ user_id: userId, profile }),
          }
        );
        if (data.conversation_id && data.session_id) {
          setProfile(profile);
          redirectToChat(
            router,
            data.conversation_id,
            data.session_id,
            data.status === 'existing'
          );
        } else {
          console.error(data.error);
          setStartLoading(false);
          setErrorMsg('A beszélgetés indítása sikertelen. Ellenőrizd a kapcsolatot és próbáld újra.');
          errorToast({ message: 'A beszélgetés indítása sikertelen. Ellenőrizd a kapcsolatot és próbáld újra.', type: 'network' });
        }
      } catch (err) {
        console.error(err);
        setStartLoading(false);
        setErrorMsg('A beszélgetés indítása sikertelen. Ellenőrizd a kapcsolatot és próbáld újra.');
        errorToast({ message: 'A beszélgetés indítása sikertelen. Ellenőrizd a kapcsolatot és próbáld újra.', type: 'network' });
      }
    };

    return (
      <>
        <BackToLogsButton />
        <SurveySuccess profile={profile} onStart={handleStart} loading={startLoading} />
        {errorMsg && <p className={styles.error}>{errorMsg}</p>}
      </>
    );
  }

  const q = currentQuestion;

  return (
    <>
      <BackToLogsButton />
      <div className={styles.wrapper}>
        <AnimatePresence mode="wait">
          <SurveySlide
            key={step}
            direction={direction}
            question={q.q}
            instruction={q.i}
            value={answers[step]}
            progress={progress}
            isLast={isLastQuestion}
            onChange={handleChange}
            onNext={handleNext}
            onBack={!isFirstQuestion ? prevQuestion : undefined}
            bgColor={COLORS[step % COLORS.length]}
          />
        </AnimatePresence>
        {errorMsg && <p className={styles.error}>{errorMsg}</p>}
      </div>
    </>
  );
}
