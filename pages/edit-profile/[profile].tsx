import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import BackToLogsButton from '@/components/BackToLogsButton';
import { useUserContext } from '@/contexts/UserContext';
import { apiFetch } from '@/lib/api';
import { HexColorPicker } from 'react-colorful';
import 'react-colorful/dist/index.css';
import { STYLE_OPTIONS } from '@/lib/styleOptions';
import { useToast } from '@/hooks/useToast';

interface StyleData {
  [key: string]: string | null;
}

export default function EditProfilePage() {
  const router = useRouter();
  const { profile } = router.query;
  const { userId } = useUserContext();
  const toast = useToast();

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [userColor, setUserColor] = useState('#7D9EDF');
  const [aiColor, setAiColor] = useState('#C5DAF1');
  const [inspirations, setInspirations] = useState<string[]>([]);
  const [styleData, setStyleData] = useState<StyleData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile || !userId) return;
    const load = async () => {
      try {
        const info = await apiFetch<any>('/api/profile', {
          method: 'POST',
          body: JSON.stringify({ name: profile, userId }),
        });
        const meta = await apiFetch<any>('/api/profile/metadata', {
          method: 'POST',
          body: JSON.stringify({ profile }),
        });
        setName(info.name || String(profile));
        setRole(info.role || '');
        setUserColor(info.user_color);
        setAiColor(info.ai_color);
        setInspirations(meta.inspirations || []);
        setStyleData({ ...meta, ...info.style_data });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [profile, userId]);

  const handleAddInspiration = () => {
    if (inspirations.length >= 8) return;
    setInspirations([...inspirations, '']);
  };

  const handleSave = async () => {
    if (!userId || !profile) return;
    try {
      await apiFetch('/api/profile/update', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          profile,
          name,
          role,
          user_color: userColor,
          ai_color: aiColor,
          inspirations,
          style_data: styleData,
        }),
      });
      toast('Profil mentve');
      router.push('/select-profile');
    } catch (err) {
      console.error(err);
      toast('Hiba a mentés közben');
    }
  };

  if (loading) return <div className="p-4">Betöltés...</div>;

  return (
    <div className="min-h-screen p-4" style={{ overflowY: 'auto' }}>
      <BackToLogsButton />
      <h1 className="text-xl font-bold mb-4 mt-8">Személyes profil szerkesztése</h1>
      <div className="flex flex-col gap-4 max-w-xl mx-auto">
        <label className="flex flex-col">
          <span className="font-medium">Profil neve</span>
          <input
            className="border rounded p-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="flex flex-col">
          <span className="font-medium">Profil szerepe</span>
          <input
            className="border rounded p-2"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
        </label>
        <div className="flex gap-4">
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-8 h-8 rounded-full border"
              style={{ backgroundColor: userColor }}
            />
            <HexColorPicker color={userColor} onChange={setUserColor} />
          </div>
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-8 h-8 rounded-full border"
              style={{ backgroundColor: aiColor }}
            />
            <HexColorPicker color={aiColor} onChange={setAiColor} />
          </div>
        </div>
        <div>
          <span className="font-medium">Inspirációk</span>
          <div className="flex flex-col gap-2 mt-2">
            {inspirations.map((insp, idx) => (
              <input
                key={idx}
                className="border rounded p-2"
                value={insp}
                onChange={(e) => {
                  const arr = [...inspirations];
                  arr[idx] = e.target.value;
                  setInspirations(arr);
                }}
              />
            ))}
            {inspirations.length < 8 && (
              <button
                type="button"
                className="text-blue-600 text-sm"
                onClick={handleAddInspiration}
              >
                + Új inspiráció hozzáadása
              </button>
            )}
          </div>
        </div>
        {Object.entries(STYLE_OPTIONS).map(([key, opts]) => (
          <label key={key} className="flex flex-col">
            <span className="font-medium">{key.replace('style_', '')}</span>
            <select
              className="border rounded p-2"
              value={styleData[key] || ''}
              onChange={(e) => setStyleData({ ...styleData, [key]: e.target.value })}
            >
              <option value="">(nincs)</option>
              {Object.entries(opts).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        ))}
        <div className="flex justify-end py-4">
          <button
            type="button"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            onClick={handleSave}
          >
            Mentés
          </button>
        </div>
      </div>
    </div>
  );
}