import '../styles/globals.css';
import Nav from '../components/Nav';

export default function App({ Component, pageProps }) {
  return (
    <div>
      <Nav />
      <main className="max-w-6xl mx-auto p-4">
        <Component {...pageProps} />
      </main>
    </div>
  );
}
