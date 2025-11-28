import Demo from '@/components/Demo';
import Ecosystem from '@/components/Ecosystem';
import Features from '@/components/Features';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import Navbar from '@/components/Navbar';

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <Features />
      <Ecosystem />
      <Demo />
      <Footer />
    </main>
  );
}
