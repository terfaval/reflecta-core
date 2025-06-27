import React, { useEffect, useState } from 'react';
import SurveySlide from '@/components/SurveySlide';
import SurveySuccess from '@/components/SurveySuccess';
import SpiralLoader from '@/components/SpiralLoader';
import UserErrorDisplay from '@/components/UserErrorDisplay';
import { useUserContext } from '@/contexts/UserContext';
import { useRouter } from 'next/router';
import { useProfileContext } from '@/contexts/ProfileContext';
import { apiFetch } from '@/lib/api';

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

export default function ProfileBuilder() {
  const { userId, userInitialized, userError } = useUserContext();
  const { setProfile } = useProfileContext();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>(['', '', '', '', '']);
  const [profileName, setProfileName] = useState('Személyes profil');
  const [finished, setFinished] = useState(false);
  const [startLoading, setStartLoading] = useState(false);
  const router = useRouter();

  // user initialization handled globally in UserProvider

  useEffect(() => {
    if (!userId) return;
    apiFetch<{ role?: string; personalProfiles?: string[] }>('/api/profile-list', {
      method: 'POST',
      body: JSON.stringify({ userId })
    })
      .then(data => {
        if (data.role !== 'premium' || (data.personalProfiles || []).length) {
          router.push('/non-authorized');
        }
      })
      .catch(console.error);
  }, [userId, router]);

  const handleChange = (value: string) => {
    const arr = [...answers];
    arr[step] = value;
    setAnswers(arr);
  };

  const handleNext = () => {
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      submit();
    }
  };

  const submit = async () => {
    if (!userId) return;
    try {
      const data = await apiFetch<{ name: string }>(
        '/api/profile/from-survey',
        {
          method: 'POST',
          body: JSON.stringify({ user_id: userId, name: profileName, answers }),
        }
      );
      setProfileName(data.name || profileName);
      setFinished(true);
    } catch (err) {
      console.error(err);
    }
  };

  if (userError) {
    return (
      <UserErrorDisplay
        message={userError}
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!userInitialized) {
    return (
      <SpiralLoader userColor="#7A4DFF" aiColor="#FFB347" />
    );
  }

  if (finished) {
    const handleStart = async () => {
      if (!userId || startLoading) return;
      setStartLoading(true);
      try {
        const data = await apiFetch<{ conversation_id: string; session_id: string; error?: string }>(
          '/api/conversation/new',
          {
            method: 'POST',
            body: JSON.stringify({ user_id: userId, profile_name: profileName }),
          }
        );
        if (data.conversation_id && data.session_id) {
          setProfile(profileName);
          router.push(`/chat?conversation=${data.conversation_id}&session=${data.session_id}`);
        } else {
          console.error(data.error);
          setStartLoading(false);
        }
      } catch (err) {
        console.error(err);
        setStartLoading(false);
      }
    };

    return (
<SurveySuccess profileName={profileName} onStart={handleStart} loading={startLoading} />
    );
  }

  const q = QUESTIONS[step];

  return (
    <SurveySlide
      question={q.q}
      instruction={q.i}
      value={answers[step]}
      step={step + 1}
      total={QUESTIONS.length}
      onChange={handleChange}
      onNext={handleNext}
      onBack={step > 0 ? () => setStep(step - 1) : undefined}
    />
  );
}
