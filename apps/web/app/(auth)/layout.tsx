export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col mx-auto max-w-xl justify-center h-screen p-6">
      {children}
    </div>
  );
}
