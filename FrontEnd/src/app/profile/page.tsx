import ProfileSettings from "@/components/sections/ProfileSettings";
import Navbar from "@/components/layout/Navbar";

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="pt-32 pb-16 px-4">
        <ProfileSettings />
      </div>
    </main>
  );
}