import React, { useEffect } from "react";

import Head from "next/head";
import ProfileSlider from "@/components/ProfileSlider";
import SpiralLoader from "@/components/SpiralLoader";
import UserErrorDisplay from "@/components/UserErrorDisplay";
import { useUserContext } from "@/contexts/UserContext";
import { useRouter } from "next/router";

export default function ProfileSelectorPage() {
  const router = useRouter();
  const { userInitialized, userError, userRole } = useUserContext();

  useEffect(() => {
    if (!router.isReady) return;
    if (userRole === 'guest') {
      router.replace('/guest-chat');
    }
  }, [router, userRole]);
  

  if (userError)
    return (
      <UserErrorDisplay
        message={userError}
        onRetry={() => window.location.reload()}
      />
    );

  if (!userInitialized)
    return <SpiralLoader userColor="#7A4DFF" aiColor="#FFB347" />;

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
          justifyContent: "flex-start",
          gap: "1.5rem",
          textAlign: "center",
          width: "100%",
          padding: "0 1rem 2rem",
          overflowY: "auto",
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