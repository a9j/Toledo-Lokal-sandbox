/**
 * What the app shows when the build had no Supabase settings.
 *
 * Without this the page is blank: createClient throws while the module is
 * still loading, so React never renders and the only clue is a library error
 * in the console. A blank page is the hardest kind of failure to diagnose,
 * and the fix is a setting rather than a code change, so the screen says
 * which setting and where.
 */
export function SetupNeeded() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: '#0A0F1E',
        color: '#E8ECF5',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div style={{ maxWidth: '520px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600, margin: '0 0 12px' }}>
          This build has no database settings
        </h1>
        <p style={{ fontSize: '15px', lineHeight: 1.6, margin: '0 0 16px', color: '#A8B3C7' }}>
          The app cannot start because it does not know which Supabase project to talk to.
          Nothing is broken in the code. Two settings are missing from wherever this was
          built.
        </p>
        <p style={{ fontSize: '15px', lineHeight: 1.6, margin: '0 0 8px', color: '#A8B3C7' }}>
          Add these, then build again:
        </p>
        <pre
          style={{
            background: '#111A2E',
            border: '1px solid #24304A',
            borderRadius: '10px',
            padding: '14px',
            fontSize: '13px',
            lineHeight: 1.7,
            overflowX: 'auto',
            margin: '0 0 16px',
          }}
        >
{`VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your publishable key>`}
        </pre>
        <p style={{ fontSize: '13px', lineHeight: 1.6, margin: 0, color: '#7C89A0' }}>
          On Vercel these go in Project Settings, Environment Variables, and the project
          has to be redeployed afterwards so the build picks them up. Locally they go in
          a .env file at the root. The names NEXT_PUBLIC_SUPABASE_URL and
          NEXT_PUBLIC_SUPABASE_ANON_KEY work too, which is what the Supabase and Vercel
          integration sets.
        </p>
      </div>
    </div>
  );
}
