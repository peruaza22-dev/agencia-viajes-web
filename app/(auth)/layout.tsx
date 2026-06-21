// Auth layout — minimal, sin header ni footer
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div id="body">{children}</div>;
}
