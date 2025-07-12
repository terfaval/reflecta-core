import React from "react";
import gridStyles from "./JourneyGrid.module.css";
import cardStyles from "./JourneyCard.module.css";

interface JourneyStep {
  title: string;
  description: string;
}

const journeySteps: JourneyStep[] = [
  {
    title: "1. Beszélgetés indítása",
    description:
      "Válassz egy profilt. Minden profilhoz egy önálló beszélgetés tartozik, amelyben a naplóbejegyzéseid egymásra épülő sessionökben tárolódnak. A kiválasztás után azonnal elindul a beszélgetés.",
  },
  {
    title: "2. Beszélgetés közben",
    description:
      "Írj szabadon, a profil pedig a saját stílusában reagál. Minden válasza alatt finomhangoló gombokat találsz – ezekkel újrafogalmazást kérhetsz. Ha szeretnéd, közben válthatsz másik profilra is, de minden profil csak a saját beszélgetését ismeri.",
  },
  {
    title: "3. Beszélgetés lezárása",
    description:
      "A „Mára elég volt” gombbal lezárhatod az aktuális sessiont. Ez segíti a rendszeredben a témák, mélységek és visszatekintések későbbi kezelését. A beszélgetés nem vész el, bármikor visszatérhetsz hozzá vagy folytathatod egy új sessionnel.",
  },
];

function JourneyCard({ title, description }: JourneyStep) {
  return (
<div className={cardStyles.card}>
      <h3 className={cardStyles.title}>{title}</h3>
      <p className={cardStyles.description}>{description}</p>
    </div>
  );
}

export default function JourneyGrid() {
  return (
    <div className={gridStyles.grid}>
      {journeySteps.map((step) => (
        <JourneyCard key={step.title} {...step} />
      ))}
    </div>
  );
}