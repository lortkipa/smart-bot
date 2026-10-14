import { SignIn } from "./auth/SignIn";
import lockup from "./lockup.svg";
import lockupDark from "./lockup-dark.svg";

export function App() {
  return (
    <>
      <header className="header">
        <picture>
          <source srcSet={lockupDark} media="(prefers-color-scheme: dark)" />
          <img className="lockup" src={lockup} alt="Smart Bot" />
        </picture>
      </header>
      <main className="main">
        <div className="panel">
          <SignIn />
        </div>
      </main>
    </>
  );
}
