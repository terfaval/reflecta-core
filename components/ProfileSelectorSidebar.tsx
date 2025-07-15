import React from "react";
import { LucidePlusCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/router";

import SidebarProfileItem from "./SidebarProfileItem";
import styles from "./ProfileSelectorSidebar.module.css";
import { useProfileContext } from "@/contexts/ProfileContext";
import { useAvailableProfiles } from "@/hooks/useAvailableProfiles";
import { useUserContext } from "@/contexts/UserContext";
import { useProfileUsage } from "../hooks/useProfileUsage";
import { useHiddenProfiles } from "../hooks/useHiddenProfiles";
import { useToast } from "../hooks/useToast";
import { useErrorToast } from "../hooks/useErrorToast";
import { apiFetch } from "@/lib/api";
import { useLastEntryContext } from "@/contexts/LastEntryContext";

const MAX_TEXT_LENGTH = 32;

function truncateWithEllipsis(text: string, maxLength: number = MAX_TEXT_LENGTH) {
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
  const { profiles: availableProfiles, personalNames, role } = useAvailableProfiles();
  const { userRole, userId } = useUserContext();
  const { usage, recordUse } = useProfileUsage();
  const { hidden, hideProfile, showAll } = useHiddenProfiles();
  const toast = useToast();
  const errorToast = useErrorToast();
  const { lastEntryMap } = useLastEntryContext();
  const [open, setOpen] = React.useState(true);

  const handleDelete = async (name: string) => {
    if (!userId) return;
    if (!window.confirm('Biztosan törlöd a profilt?')) return;
    try {
      await apiFetch('/api/profile/delete', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, profile: name }),
      });
      toast('Profil törölve');
      hideProfile(name);
    } catch (err) {
      console.error('[delete_profile]', err);
      errorToast({ message: 'Hiba a törlés közben.', type: 'network', error: err });
    }
  };

  if (userRole === 'guest') return null;

  const customProfiles = React.useMemo(() => {
    if (!personalNames.length) return [] as Profile[];
    return availableProfiles.filter((p) => personalNames.includes(p.name));
  }, [availableProfiles, personalNames]);

  const baseProfiles = React.useMemo(() => {
    return availableProfiles.filter((p) => !personalNames.includes(p.name));
  }, [availableProfiles, personalNames]);

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
    const activeId = activeProfileId?.toLowerCase();
    const used: Profile[] = [];
    const unused: Profile[] = [];
    allProfiles.forEach((p) => {
      if (p.id.toLowerCase() === activeId) return;
      if (hidden.includes(p.id)) return;
      if (usage[p.id]) used.push(p);
      else unused.push(p);
    });
    used.sort((a, b) => (usage[b.id] || 0) - (usage[a.id] || 0));
    return [...used, ...unused];
  }, [allProfiles, usage, activeProfileId, hidden]);

  const showCreateButton =
        userRole !== 'guest' && (role === 'admin' || (role !== 'basic' && customProfiles.length === 0));
  
  return (
    <aside className={`${styles.sidebar} ${open ? '' : styles.closed}`}>
      <button
        className={styles.toggle}
        onClick={() => setOpen(!open)}
        aria-label={open ? 'Összecsukás' : 'Megnyitás'}
      >
        {open ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>
      {open && showCreateButton && (
        <button
          key="create-custom"
          onClick={() => userRole !== 'guest' && onCreateCustomProfile()}
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
      {open && activeProfile && (
        (() => {
          const list = entries[activeProfile.id] || [];
          let lastUser = [...list].reverse().find((e) => e.role === 'user');
          if (!lastUser && lastEntryMap[activeProfile.id]) {
            lastUser = {
              id: '',
              role: 'user',
              content: lastEntryMap[activeProfile.id]!.content,
              created_at: lastEntryMap[activeProfile.id]!.created_at,
            };
          }
          const bottomText = lastUser ? lastUser.content : activeProfile.role;
          const bottomClass = lastUser ? 'text-sm' : 'text-sm font-medium';
          return (
            <SidebarProfileItem
              name={activeProfile.name}
              bottomText={bottomText}
              bottomClassName={bottomClass}
              iconName={activeProfile.iconName}
              color={activeProfile.user_color}
              isActive
              onEdit={personalNames.includes(activeProfile.name) ? () =>
                router.push(`/edit-profile/${encodeURIComponent(activeProfile.name)}`)
                : undefined}
              onDelete={personalNames.includes(activeProfile.name) ? () => handleDelete(activeProfile.name) : undefined}
              onHide={() => hideProfile(activeProfile.id)}
              onShowAll={showAll}
              showShowAll={hidden.length > 0}
            />
          );
        })()
      )}
      {open && otherProfiles.map((p) => {
        const list = entries[p.id] || [];
        let lastUser = [...list].reverse().find((e) => e.role === "user");
        if (!lastUser && lastEntryMap[p.id]) {
          lastUser = {
            id: '',
            role: 'user',
            content: lastEntryMap[p.id]!.content,
            created_at: lastEntryMap[p.id]!.created_at,
          };
        }
        const bottomText = lastUser ? lastUser.content : p.role;
        const bottomClass = lastUser ? "text-sm" : "text-sm font-medium text-gray-600";
        return (
          <SidebarProfileItem
            key={p.id}
            onClick={() => {
              recordUse(p.id);
              onProfileSelect(p);
            }}
            name={p.name}
            bottomText={bottomText}
            bottomClassName={bottomClass}
            iconName={p.iconName}
            color={p.user_color}
            hoverBackground={p.ai_color}
            onEdit={personalNames.includes(p.name) ? () => router.push(`/edit-profile/${encodeURIComponent(p.name)}`) : undefined}
            onDelete={personalNames.includes(p.name) ? () => handleDelete(p.name) : undefined}
            onHide={() => hideProfile(p.id)}
            onShowAll={showAll}
            showShowAll={hidden.length > 0}
            unused={!usage[p.id]}
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