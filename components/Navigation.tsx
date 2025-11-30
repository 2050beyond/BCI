import Link from 'next/link';

export default function Navigation() {
  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-bold uppercase tracking-tight">
            BCI
          </Link>
          <div className="flex space-x-8">
            <Link
              href="/"
              className="text-sm uppercase tracking-wide hover:underline"
            >
              Home
            </Link>
            <Link
              href="/about"
              className="text-sm uppercase tracking-wide hover:underline"
            >
              About
            </Link>
            <Link
              href="/careers"
              className="text-sm uppercase tracking-wide hover:underline"
            >
              Careers
            </Link>
            <Link
              href="/contact"
              className="text-sm uppercase tracking-wide hover:underline"
            >
              Contact
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

