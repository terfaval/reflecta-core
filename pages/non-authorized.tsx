// pages/non-authorized.tsx
export default function NotAuthorized() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>🚫 Nincs jogosultság</h1>
      <p>Nem vagy bejelentkezve vagy lejárt a jogosultságod.</p>
    </div>
  );
}
