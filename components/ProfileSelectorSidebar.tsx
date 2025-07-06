import React from "react";
import { LucidePlusCircle } from "lucide-react";
import { useRouter } from "next/router";

import SidebarProfileItem from "./SidebarProfileItem";
import styles from "./ProfileSelectorSidebar.module.css";
import { useProfileContext } from "@/contexts/ProfileContext";
import { useAvailableProfiles } from "@/hooks/useAvailableProfiles";

const builtInProfiles = [
  "Reflecta",
  "Akasza",
  "Éana",
  "Luma",
  "Sylva",
  "Zentó",
  "Oneiros",
  "Kairos",
  "Noe",
];

const MAX_TEXT_LENGTH = 32;

function truncateWithEllipsis(
  text: string,
  maxLength: number = MAX_TEXT_LENGTH,
) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  const words = text.split(" ");
  let result = "";
  for (const word of words) {
    if (result.length === 0) {
      if (word.length > maxLength) {
        return word.slice(0, maxLength) + "...";
      }
      result = word;
      continue;
    }
    if (result.length + 1 + word.length > maxLength) break;
    result += " " + word;
  }
  return result + "...";
}

export interface Profile {
  id: string;
  name: string;
  role: string;
  bg_color: string;
  user_color: string;
  ai_color: string;
  iconName?: string;
}

export interface Entry {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

export interface ProfileSelectorSidebarProps {
  entries: Record<string, Entry[]>;
  onProfileSelect: (profile: Profile) => void;
  onCreateCustomProfile: () => void;
}

export default function ProfileSelectorSidebar({
  entries,
  onProfileSelect,
  onCreateCustomProfile,
}: ProfileSelectorSidebarProps) {
  const { profile: activeProfileId } = useProfileContext();
  const router = useRouter();
  const { profiles: availableProfiles, role } = useAvailableProfiles();

  const customProfiles = React.useMemo(() => {
    return availableProfiles.filter((p) => !builtInProfiles.includes(p.name));
  }, [availableProfiles]);

  const baseProfiles = React.useMemo(() => {
    return availableProfiles.filter((p) => builtInProfiles.includes(p.name));
  }, [availableProfiles]);

  const allProfiles = React.useMemo(() => {
    const arr: Profile[] = [];
    arr.push(...customProfiles);
    arr.push(...baseProfiles);
    return arr;
  }, [customProfiles, baseProfiles]);

  const activeProfile = React.useMemo(() => {
    if (!activeProfileId) return null;
    const found = allProfiles.find(
      (p) => p.id.toLowerCase() === activeProfileId.toLowerCase(),
    );
    if (found) return found;
    return null;
  }, [allProfiles, activeProfileId]);

  const otherProfiles = React.useMemo<Profile[]>(() => {
    const arr: Profile[] = [];
    const activeId = activeProfileId?.toLowerCase();
    customProfiles.forEach((p) => {
      if (p.id.toLowerCase() !== activeId) arr.push(p);
    });
    baseProfiles.forEach((p) => {
      if (p.id.toLowerCase() !== activeId) arr.push(p);
    });
    return arr;
  }, [baseProfiles, customProfiles, activeProfileId]);

  const showCreateButton =
    role === "admin" || (role !== "basic" && customProfiles.length === 0);
  
  return (
    <aside className={styles.sidebar}>
      {activeProfile &&
        (() => {
          const list = entries[activeProfile.id] || [];
          const lastUser = [...list].reverse().find((e) => e.role === "user");
          const bottomText = lastUser ? lastUser.content : activeProfile.role;
          const bottomClass = lastUser ? "text-sm" : "text-sm font-medium";
          return (
            <SidebarProfileItem
              name={activeProfile.name}
              bottomText={bottomText}
              bottomClassName={bottomClass}
              iconName={activeProfile.iconName}
              color={activeProfile.user_color}
              isActive
              onEdit={
                !builtInProfiles.includes(activeProfile.name)
                  ? () =>
                      router.push(
                        `/edit-profile/${encodeURIComponent(activeProfile.name)}`,
                      )
                  : undefined
              }
            />
          );
})()}
      {showCreateButton && (
        <button
          key="create-custom"
          onClick={onCreateCustomProfile}
          className={`${styles.item} ${styles.create}`}
        >
          <div className={styles.icon}>
            <LucidePlusCircle className="w-8 h-8 stroke-gray-400" />
          </div>
          <span className="text-sm font-medium">
            Hozd létre a személyes naplódat!
          </span>
        </button>
      )}
      {otherProfiles.map((p) => {
        const list = entries[p.id] || [];
        const lastUser = [...list].reverse().find((e) => e.role === "user");
        const bottomText = lastUser ? lastUser.content : p.role;
        const bottomClass = lastUser
          ? "text-sm"
          : "text-sm font-medium text-gray-600";
        return (
          <SidebarProfileItem
            key={p.id}
            onClick={() => onProfileSelect(p)}
            name={p.name}
            bottomText={bottomText}
            bottomClassName={bottomClass}
            iconName={p.iconName}
            color={p.user_color}
            hoverBackground={p.ai_color}
            onEdit={
              !builtInProfiles.includes(p.name)
                ? () =>
                    router.push(`/edit-profile/${encodeURIComponent(p.name)}`)
                : undefined
            }
          />
        );
      })}
    </aside>
  );
}

// Example usage with mock data
const mockEntries: Record<string, Entry[]> = {
  akasza: [
    { id: "1", role: "assistant", content: "Szia", created_at: "2024-01-01" },
  ],
};

export function MockProfileSelectorSidebar() {
  return (
    <ProfileSelectorSidebar
      entries={mockEntries}
      onProfileSelect={(p) => console.log("select", p.id)}
      onCreateCustomProfile={() => console.log("create custom")}
    />
  );
}