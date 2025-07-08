import React from 'react';
import * as FIcons from '@/components/icons/functions';
import styles from './FeatureMap.module.css';
import ProfileSlider from '@/components/ProfileSlider';
import FeatureGrid from '@/components/FeatureGrid';
import FeatureTable from '@/components/FeatureTable';
import { FunctionInfo } from '@/components/FeatureCard';

const FUNCTIONS: FunctionInfo[] = [
  {
    name: 'Testérzet-figyelés',
    level: 'basic',
    description:
      'Figyelmedet a testedre irányítva fedezheted fel, milyen érzések vannak jelen most. Segít a testi jelzések tudatosításában és a belső nyugalom elmélyítésében.',
    tip: 'szeretnék egy testérzet figyelést csinálni',
    Icon: FIcons.IconBodySensation,
  },
  {
    name: 'Csendben Maradás',
    level: 'basic',
    description:
      'Egy biztonságos tér a szavak nélküli jelenléthez. A csendben maradás segít lassítani, megpihenni, és hagyni, hogy a belső folyamatok maguktól rendeződjenek.',
    tip: 'szeretnék csak csendben maradni',
    Icon: FIcons.IconSilentPresence,
  },
  {
    name: 'Rejtett Mintázatok',
    level: 'basic',
    description:
      'Segít meglátni, hogyan kapcsolódnak össze a benned kavargó érzések és gondolatok. Ha valami most még kusza, ez a funkció támogat a felfedezésben.',
    tip: 'szeretnék felfedezni rejtett mintázatokat',
    Icon: FIcons.IconHiddenPatterns,
  },
  {
    name: 'Belső Küszöb Átlépése',
    level: 'advanced',
    description:
      'Amikor úgy érzed, elérkeztél egy fontos belső határhoz, ez a funkció segít megjeleníteni és átlépni azt. Egy lassú, biztonságos folyamat, amely a belső változásra hív.',
    tip: 'szeretnék belső küszöböt átlépni',
    Icon: FIcons.IconInnerThreshold,
  },
  {
    name: 'A Nem-Tudás Gondozása',
    level: 'advanced',
    description:
      'Ez a funkció megtanít arra, hogyan maradhatsz jelen a bizonytalanságban. Nem a megoldás a cél, hanem a nem-tudás elfogadása és a belső nyugalom megélése.',
    tip: 'szeretném gondozni a nem-tudást',
    Icon: FIcons.IconNotKnowing,
  },
  {
    name: 'Gondolati Spirál Felfedezése',
    level: 'advanced',
    description:
      'Ha úgy érzed, hogy ugyanazokon a gondolatokon rágódsz újra meg újra, ez a funkció segít felfedezni, mi rejlik a spirál mélyén, és hogyan lehetne továbblépni.',
    tip: 'szeretnék felfedezni egy gondolati spirált',
    Icon: FIcons.IconThoughtSpiral,
  },
  {
    name: 'Belső Párbeszéd',
    level: 'premium',
    description:
      'Segít egy biztonságos, belső párbeszédben kimondani mindazt, amit egy másik személlyel kapcsolatban érzel. Itt teret kaphatnak a kimondatlan szavak és lezáratlan érzések.',
    tip: 'szeretnék egy belső párbeszédet',
    Icon: FIcons.IconInnerDialogue,
  },
  {
    name: 'Belső Képalkotás',
    level: 'premium',
    description:
      'Ebben a folyamatban egy belső képet, szimbólumot vagy jelenetet alkothatsz, amely segít kifejezni a benned lévő érzéseket.',
    tip: 'szeretnék belső képet alkotni',
    Icon: FIcons.IconInnerImage,
  },
  {
    name: 'Belső Levél',
    level: 'premium',
    description:
      'Ez a funkció segít megírni egy olyan levelet, amit senkinek sem kell elküldened — csak magadért írod, hogy tisztábban láss.',
    tip: 'szeretnék írni egy belső levelet',
    Icon: FIcons.IconInnerLetter,
  },
];

const ACCESS = [
  { name: 'Személyes profil létrehozása', basic: true, premium: true },
  { name: 'Testérzet-figyelés', basic: true, premium: true },
  { name: 'Csendben Maradás', basic: true, premium: true },
  { name: 'Rejtett Mintázatok', basic: true, premium: true },
  { name: 'Belső Küszöb Átlépése', basic: false, premium: true },
  { name: 'A Nem-Tudás Gondozása', basic: false, premium: true },
  { name: 'Gondolati Spirál Felfedezése', basic: false, premium: true },
  { name: 'Belső Párbeszéd', basic: false, premium: true },
  { name: 'Belső Képalkotás', basic: false, premium: true },
  { name: 'Belső Levél', basic: false, premium: true },
];

export default function FunkcioTerkep() {
  return (
    <div className={`${styles.pageContainer} p-8 space-y-16`}>
      <section className="space-y-4">
        <h1 className="text-3xl font-bold">Funkciótérkép</h1>
        <p>
          Itt áttekintheted, milyen funkciók érhetők el a Reflectában. Ez nem
          naplóindító felület, hanem egy térkép, hogy könnyebben eligazodj a
          lehetőségek között.
        </p>
      </section>

      <section className="space-y-4">
        <p>
          A Reflecta profiljai mind egyedi szemléletet és hangot képviselnek.
          Nézd meg, milyen hozzáállással kísérhetnek az önreflexióban.
        </p>
        <ProfileSlider />
      </section>

      <section className="space-y-4">
        <p>
          A Reflecta funkcióit a rendszer automatikusan is javasolhatja a
          beszélgetés során, ha úgy érzékeli, hogy hasznos lehet. Ugyanakkor
          bármelyik funkció közvetlenül is elindítható egyetlen pontos
          üzenettel — ezeket a kártyákon az ‘Indítási tipp’ mezőben találod.
        </p>
        <FeatureGrid functions={FUNCTIONS} />
      </section>

      <section className="space-y-4">
        <p>
          Az alábbi táblázatban megnézheted, hogy a különböző funkciók mely
          felhasználói szinteken érhetők el.
        </p>
        <FeatureTable access={ACCESS} />
      </section>
    </div>
  );
}