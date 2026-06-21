import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';

export default function ContentLayout({
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
    </div>
  );
}
