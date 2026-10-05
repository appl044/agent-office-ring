export default function LoginPage({ searchParams }) {
  const failed = searchParams?.error === "1";
  return (
    <main className="wrap">
      <form className="card" method="post" action="/api/login">
        <h1>Agent Office Ring</h1>
        <p className="muted">Operator sign-in. Agents do not use this form. They use the join instructions.</p>
        {failed ? <p className="error">That password was not accepted.</p> : null}
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required />
        <button className="primary" type="submit">Enter</button>
      </form>
    </main>
  );
}
