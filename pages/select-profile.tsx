import React, { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import ProfileSlider from "@/components/ProfileSlider";
import SpiralLoader from "@/components/SpiralLoader";
import UserErrorDisplay from "@/components/UserErrorDisplay";
import { useUserContext } from "@/contexts/UserContext";
import { useProfileContext } from "@/contexts/ProfileContext";
import { toast } from "react-toastify";

import { apiFetch } from "@/lib/api";

export default function ProfileSelectorPage() {
  const router = useRouter();
  const { userId, userInitialized, userError } = useUserContext();
  const { setProfile } = useProfileContext();
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFirst, setIsFirst] = useState(false);

  useEffect(() => {
    if (loaded) {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [loaded]);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      try {
        const data = await apiFetch<{ profile?: string; sessionId?: string }>(
          `/api/last-session?userId=${encodeURIComponent(userId)}`,
          { method: "GET" }
        );
        if (data.sessionId) {
          if (data.profile) setProfile(data.profile);
          toast.info("Korábbi beszélgetés folytatódik…");
          router.replace(`/chat?session=${data.sessionId}`);
          return;
        }
        setIsFirst(true);
      } catch (err) {
        console.error("[last-session]", err);
        setError("Nem sikerült lekérni az előző munkamenetet.");
      }
      setLoaded(true);
    };
    load();
  }, [userId, router, setProfile]);

  if (userError)
    return (
      <UserErrorDisplay
        message={userError}
        onRetry={() => window.location.reload()}
      />
    );

  if (!userInitialized)
    return <SpiralLoader userColor="#7A4DFF" aiColor="#FFB347" />;

 if (!loaded) return <SpiralLoader userColor="#7A4DFF" aiColor="#FFB347" />;

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div
        style={{
          minHeight: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.5rem",
          textAlign: "center",
          width: "100%",
          padding: "0 1rem 2rem",
        }}
      >
      <h1
        style={{
          fontFamily: "Raleway, sans-serif",
          fontSize: "1.75rem",
          fontWeight: 600,
          margin: "2rem 0 1.5rem 0",
        }}
      >
        Válassz naplóprofilt!
      </h1>
      {error && (
        <p style={{ color: 'red', fontFamily: 'Raleway, sans-serif' }}>{error}</p>
      )}
      <ProfileSlider />
      <p
        style={{
          fontFamily: "Raleway, sans-serif",
          fontSize: "0.875rem",
          lineHeight: 1.4,
          marginTop: "0.5rem",
        }}
      >
        Az egyes profilok különböző önismereti utakon kísérnek.<br />
        Más kérdéseket tesznek fel, másképp hallgatnak.<br />
        Válassz egyet, akivel most elindulnál – később bármikor válthatsz.
      </p>
      </div>
    </>
  );
}