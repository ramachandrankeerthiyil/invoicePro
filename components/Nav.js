import Link from 'next/link';
import { useRouter } from 'next/router';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/invoices', label: 'Invoices' },
  { href: '/import', label: 'Import' },
];

export default function Nav() {
  const router = useRouter();

  return (
    <nav className="bg-white border-b">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-6">
        <span className="font-bold text-lg">InvoicePro</span>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={
              router.pathname.startsWith(link.href)
                ? 'text-blue-600 font-medium'
                : 'text-gray-600 hover:text-gray-900'
            }
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
