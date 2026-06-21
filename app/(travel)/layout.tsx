import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';
import ChatWidget from '@/components/ChatWidget';

export default function TravelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div id="body">
      <MobileNav />
      <Header />
      {children}
      <Footer />
      <ChatWidget />
    </div>
  );
}
