import React from 'react';
import { ProfileIcon, iconMap } from './ProfileIcons';
import styles from './ProfileSelectorSidebar.module.css';

const MAX_TEXT_LENGTH = 32;

function truncate(text: string, maxLength: number = MAX_TEXT_LENGTH) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  const words = text.split(' ');
  let result = '';
  for (const word of words) {
    if (result.length === 0) {
      if (word.length > maxLength) {
        return word.slice(0, maxLength) + '...';
      }
      result = word;
      continue;
    }
    if (result.length + 1 + word.length > maxLength) break;
    result += ' ' + word;
  }
  return result + '...';
}

export interface SidebarProfileItemProps {
  name: string;
  bottomText: string;
  color: string;
  iconName?: string;
  isActive?: boolean;
  bottomClassName?: string;
  onClick?: () => void;
  hoverBackground?: string;
  onEdit?: () => void;
  unused?: boolean;
  onDelete?: () => void;
  onHide?: () => void;
  onShowAll?: () => void;
  showShowAll?: boolean;
}

export default function SidebarProfileItem({
  name,
  bottomText,
  color,
  iconName,
  isActive = false,
  bottomClassName = '',
  onClick,
  hoverBackground,
  onEdit,
  unused = false,
  onDelete,
  onHide,
  onShowAll,
  showShowAll = false,
}: SidebarProfileItemProps) {
  const IconComp = iconName && iconMap[iconName];
  const [isHovered, setIsHovered] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!menuOpen) return;
    const handle = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [menuOpen]);

  const style: React.CSSProperties = { transition: 'background-color 0.2s ease' };
  if (isActive) {
    style.backgroundColor = color;
  } else if (isHovered && hoverBackground) {
    style.backgroundColor = hoverBackground;
  }
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`${styles.item} ${isActive ? styles.activeItem : ''}`}
      style={style}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className={styles.icon}>
        {IconComp ? (
          <ProfileIcon icon={IconComp} color={isActive ? 'white' : color} size={32} />
        ) : (
          <div className="w-8 h-8 rounded-full" style={{ backgroundColor: isActive ? 'white' : color }} />
        )}
        {unused && <span className={styles.newDot} />}
      </div>
      <div className={styles.textContainer}>
        <span className={styles.itemHeader}>{truncate(name)}</span>
        <span className={`${styles.itemSubtext} ${bottomClassName}`}>{truncate(bottomText)}</span>
      </div>
      <div className={styles.menuWrapper} ref={menuRef}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((o) => !o);
          }}
          className={styles.menuButton}
          aria-label="Profil menü"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <circle cx="12" cy="5" r="1" />
            <circle cx="12" cy="12" r="1" />
            <circle cx="12" cy="19" r="1" />
          </svg>
        </button>
      {menuOpen && (
          <div className={styles.menu}>
            {onHide && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onHide();
                }}
              >
                Profil elrejtése
              </button>
            )}
            {showShowAll && onShowAll && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onShowAll();
                }}
              >
                Összes profil mutatása
              </button>
            )}
            {onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onEdit();
                }}
              >
                Profil szerkesztése
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onDelete();
                }}
              >
                Profil törlése
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}