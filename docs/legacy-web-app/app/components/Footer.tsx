export default function Footer() {
  return (
    <footer className="flex items-center justify-center w-full h-24">
      <p className="text-center text-sm text-gray-300">
        &copy; {new Date().getFullYear()} RitMEX All Rights Reserved.
      </p>
    </footer>
  );
}
