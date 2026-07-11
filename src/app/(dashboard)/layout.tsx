import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";


export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-wrapper">
        <Header />
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}
