import React, { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import ProfileCarousel, { ProfileCardData } from "@/components/ProfileCarousel";
import SpiralLoader from "@/components/SpiralLoader";
import UserErrorDisplay from "@/components/UserErrorDisplay";
import { profileStyles } from "../styles/profileStyles";
import { useUserContext } from "@/contexts/UserContext";
import { useProfileContext } from "@/contexts/ProfileContext";

import { apiFetch } from "@/lib/api";

interface Meta extends ProfileCardData {}

const BLANK_PROFILE_DESCRIPTION =
  "Alap naplóprofil, ha csak egyszerűen írnál, mindenféle irány nélkül.";

const DEFAULT_PROFILES: { name: string; iconName?: string }[] = [
  { name: "Reflecta", iconName: "ReflectaIcon" },
  { name: "Akasza", iconName: "AkaszaIcon" },
  { name: "Éana", iconName: "EanaIcon" },
  { name: "Luma", iconName: "LumaIcon" },
  { name: "Sylva", iconName: "SylvaIcon" },
  { name: "Zentó", iconName: "ZentoIcon" },
  { name: "Oneiros", iconName: "OneirosIcon" },
  { name: "Kairos", iconName: "KairosIcon" },
  { name: "Noe", iconName: "NoeIcon" },
  { name: "Solun", iconName: "SolunIcon" },
];

export default function ProfileSelectorPage() {
  const router = useRouter();
  const { userId, userInitialized, userError } = useUserContext();
  const { setProfile } = useProfileContext();
  const [profiles, setProfiles] = useState<Meta[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      try {
        const data = await apiFetch<{ hasHistory: boolean; profile?: string }>(
          "/api/has-history",
          {
            method: "POST",
            body: JSON.stringify({ userId }),
          },
        );
        if (data.hasHistory) {
          if (data.profile) setProfile(data.profile);
          router.replace("/chat");
          return;
        }
      } catch (err) {
        console.error("[has-history]", err);
      }

      try {
        const names = DEFAULT_PROFILES.map((p) => p.name);
        const meta = await apiFetch<{
          profiles: any[];
          personalProfiles?: string[];
          role?: string;
          error?: string;
        }>("/api/profile-list", {
          method: "POST",
          body: JSON.stringify({ userId, names }),
        });
        if (meta.profiles) {
          const map: Record<
            string,
            { description: string; color: string; role?: string }
          > = {};
          (meta.profiles || []).forEach((p: any) => {
            map[p.name] = {
              description: p.description,
              color: p.color,
              role: p.role,
            };
          });
          const defaults = DEFAULT_PROFILES.map((p) => {
            const style =
              profileStyles[p.name] ||
              profileStyles[p.name.toLowerCase()] || {
                "--user-color": "#000",
                "--bg-color": "#fff",
              };
            return {
              ...p,
              description:
                map[p.name]?.description ||
                (p.name === "Reflecta" ? BLANK_PROFILE_DESCRIPTION : ""),
              color: map[p.name]?.color || "#fff",
              role: map[p.name]?.role || "",
              userColor: style["--user-color"],
              bgColor: style["--bg-color"],
            };
          });

          const personalProfiles: Meta[] = [];
          (meta.personalProfiles || []).forEach((name) => {
            const pm = map[name] || { description: "", color: "#fff", role: "" };
            const style = profileStyles[name] ||
              profileStyles[name.toLowerCase()] || {
                "--user-color": "#000",
                "--bg-color": "#fff",
              };

            const def = DEFAULT_PROFILES.find((d) => d.name === name);

            personalProfiles.push({
              name,
              iconName: def?.iconName || "ReflectaIcon",
              description: pm.description,
              color: pm.color,
              role: pm.role || "",
              userColor: style["--user-color"],
              bgColor: style["--bg-color"],
              personal: true,
            });
          });

          const blankProfile = defaults[0];
          let coreProfiles = defaults.slice(1);
          personalProfiles.forEach((pp) => {
            coreProfiles = coreProfiles.filter((p) => p.name !== pp.name);
          });
          const list = [blankProfile, ...personalProfiles, ...coreProfiles];

          setProfiles(list);
        } else {
          console.error("[profile-list]", meta.error);
        }
      } catch (err) {
        console.error("[profile-list fetch]", err);
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

  const handleSelect = (p: Meta) => {
    setProfile(p.name);
    router.push("/chat");
  };

 if (!loaded) return <SpiralLoader userColor="#7A4DFF" aiColor="#FFB347" />;

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div
        style={{
          minHeight: "100dvh",
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
          margin: 0,
        }}
      >
        Válassz naplóprofilt!
      </h1>
      <ProfileCarousel profiles={profiles} onSelect={handleSelect} />
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