import type { ReactNode } from 'react';
import Link from 'next/link';

interface Breadcrumb {
  to?: string;
  icon?: string;
  label: string;
}

interface PageBannerProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
  bgImage?: string;
  children?: ReactNode;
}

export default function PageBanner({
  title,
  subtitle,
  breadcrumbs = [],
  bgImage,
  children,
}: PageBannerProps) {
  const sectionStyle = bgImage
    ? {
        background: `url(${bgImage}) no-repeat center/cover`,
        padding: '50px 0',
        position: 'relative' as const,
      }
    : {
        background:
          'linear-gradient(135deg, #001f4d 0%, #003580 60%, #0050b3 100%)',
        padding: '50px 0',
        position: 'relative' as const,
      };

  return (
    <section className="banner-blog overlay" style={sectionStyle}>
      <div className="container mx-auto px-4">
        <h1 className="text-white text-3xl md:text-4xl font-bold font-poppins mb-2">
          {title}
        </h1>
        {subtitle && (
          <h6 className="text-white/80 text-base mb-4">{subtitle}</h6>
        )}
        {children}
        {breadcrumbs.length > 0 && (
          <nav aria-label="breadcrumb" className="mt-3">
            <ol className="flex flex-wrap gap-1 text-sm text-white/70">
              {breadcrumbs.map((crumb, i) => (
                <li key={i} className="flex items-center gap-1">
                  {i > 0 && <span className="mx-1 text-white/40">/</span>}
                  {crumb.to ? (
                    <Link
                      href={crumb.to}
                      className="text-white/80 hover:text-white transition-colors"
                    >
                      {crumb.icon && (
                        <i className={`fa ${crumb.icon} mr-1`} />
                      )}
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-white/50">{crumb.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
      </div>
    </section>
  );
}
