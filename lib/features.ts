import * as FIcons from '@/components/icons/functions';
import React from 'react';

export interface FeatureInfo {
  name: string;
  tip: string;
  Icon: React.ComponentType<any>;
}

export const FEATURE_LIST: FeatureInfo[] = [
  {
    name: 'Testérzet-figyelés',
    tip: 'szeretnék egy testérzet figyelést csinálni',
    Icon: FIcons.IconBodySensation,
  },
  {
    name: 'Csendben Maradás',
    tip: 'szeretnék csak csendben maradni',
    Icon: FIcons.IconSilentPresence,
  },
  {
    name: 'Rejtett Mintázatok',
    tip: 'szeretnék felfedezni rejtett mintázatokat',
    Icon: FIcons.IconHiddenPatterns,
  },
  {
    name: 'Belső Küszöb',
    tip: 'szeretnék belső küszöböt átlépni',
    Icon: FIcons.IconInnerThreshold,
  },
  {
    name: 'Nem-Tudás Ösvénye',
    tip: 'szeretném gondozni a nem-tudást',
    Icon: FIcons.IconNotKnowing,
  },
  {
    name: 'Gondolati Spirál',
    tip: 'szeretnék felfedezni egy gondolati spirált',
    Icon: FIcons.IconThoughtSpiral,
  },
  {
    name: 'Belső Párbeszéd',
    tip: 'szeretnék egy belső párbeszédet',
    Icon: FIcons.IconInnerDialogue,
  },
  {
    name: 'Belső Képalkotás',
    tip: 'szeretnék belső képet alkotni',
    Icon: FIcons.IconInnerImage,
  },
  {
    name: 'Belső Levél',
    tip: 'szeretnék írni egy belső levelet',
    Icon: FIcons.IconInnerLetter,
  },
];